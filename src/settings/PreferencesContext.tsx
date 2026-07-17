// CCA: 4
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import i18next from '../i18n/i18n';
import { LOCAL_PLACEHOLDER_USER_ID } from '../storage/constants';
import { IndexedDbSettingsRepository } from './indexeddb/indexedDbSettingsRepository';
import type { PreferenceKey, Preferences } from './preferences';
import { resolvePreferences } from './resolvePreferences';
import { SettingsUseCase } from './settingsUseCase';

interface PreferencesContextValue {
  preferences: Preferences;
  // True while at least one preference change failed to persist and would be
  // lost on reload; in-memory state still reflects the user's choice.
  persistenceError: boolean;
  setPreference: <K extends PreferenceKey>(key: K, value: Preferences[K]) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

function browserLocale(): string | null {
  return typeof navigator === 'undefined' ? null : (navigator.language ?? null);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const useCase = useMemo(
    () => new SettingsUseCase(new IndexedDbSettingsRepository(), LOCAL_PLACEHOLDER_USER_ID),
    [],
  );
  const [preferences, setPreferences] = useState<Preferences>(() =>
    resolvePreferences(null, browserLocale(), {}),
  );
  const [failedKeys, setFailedKeys] = useState<ReadonlySet<PreferenceKey>>(new Set());

  // Keys the user changed while the initial load was still in flight; the
  // resolved effective snapshot predates those writes and must not revert them.
  const overriddenKeys = useRef(new Set<PreferenceKey>());

  useEffect(() => {
    let cancelled = false;
    useCase
      .getEffectivePreferences(null, browserLocale())
      .then((effective) => {
        if (cancelled) return;
        setPreferences((prev) => {
          const next = { ...effective };
          for (const key of overriddenKeys.current) {
            Object.assign(next, { [key]: prev[key] });
          }
          return next;
        });
      })
      .catch((error: unknown) => {
        console.error('Failed to load stored preferences', error);
      });
    return () => {
      cancelled = true;
    };
  }, [useCase]);

  useEffect(() => {
    void i18next.changeLanguage(preferences.language);
    document.documentElement.setAttribute('data-theme', preferences.theme);
  }, [preferences.language, preferences.theme]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      persistenceError: failedKeys.size > 0,
      setPreference: (key, value) => {
        overriddenKeys.current.add(key);
        setPreferences((prev) => ({ ...prev, [key]: value }));
        useCase.setOverride(key, value).then(
          () => {
            setFailedKeys((prev) => {
              if (!prev.has(key)) return prev;
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          },
          (error: unknown) => {
            console.error(`Failed to persist preference "${key}"`, error);
            setFailedKeys((prev) => new Set(prev).add(key));
          },
        );
      },
    }),
    [preferences, failedKeys, useCase],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
}

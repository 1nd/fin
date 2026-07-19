// CCA: 4
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import i18next from '../i18n/i18n';
import { useIdentity } from '../identity/IdentityContext';
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
  const { identity } = useIdentity();
  const userId = identity?.userId ?? null;

  // Keying on userId remounts the inner provider on sign-in/switch/sign-out
  // (`google-signin` D6), so its preferences/failedKeys/overriddenKeys state starts clean for
  // the new partition instead of needing to be reset by hand.
  return (
    <PreferencesProviderForUser key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </PreferencesProviderForUser>
  );
}

function PreferencesProviderForUser({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  // With no signed-in userId, there is nothing to key per-user storage by;
  // resolve the browser cascade and skip persistence (Settings is
  // unreachable while gated anyway, per `google-signin` D5).
  const useCase = useMemo(
    () => (userId ? new SettingsUseCase(new IndexedDbSettingsRepository(), userId) : null),
    [userId],
  );
  const [preferences, setPreferences] = useState<Preferences>(() =>
    resolvePreferences(browserLocale(), {}),
  );
  const [failedKeys, setFailedKeys] = useState<ReadonlySet<PreferenceKey>>(new Set());

  // Keys the user changed while the initial load was still in flight; the
  // resolved effective snapshot predates those writes and must not revert them.
  const overriddenKeys = useRef(new Set<PreferenceKey>());

  useEffect(() => {
    // With no useCase (signed out), the useState initializer above already
    // resolved the correct browser-cascade snapshot; nothing to load.
    if (!useCase) return;

    let cancelled = false;
    useCase
      .getEffectivePreferences(browserLocale())
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
        if (!useCase) return;
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

// CCA: 4
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import i18next from '../i18n/i18n';
import { LOCAL_PLACEHOLDER_USER_ID } from '../storage/constants';
import { IndexedDbSettingsRepository } from './indexeddb/indexedDbSettingsRepository';
import type { PreferenceKey, Preferences } from './preferences';
import { resolvePreferences } from './resolvePreferences';
import { SettingsUseCase } from './settingsUseCase';

interface PreferencesContextValue {
  preferences: Preferences;
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

  useEffect(() => {
    let cancelled = false;
    void useCase.getEffectivePreferences(null, browserLocale()).then((effective) => {
      if (!cancelled) setPreferences(effective);
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
      setPreference: (key, value) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
        void useCase.setOverride(key, value);
      },
    }),
    [preferences, useCase],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
}

// CCA: 2
import { useCallback, useEffect, useState } from 'react';
import { useRepository } from '@/data/repository-context';
import type {
  DateFormatPreference,
  LanguagePreference,
  NumberFormatPreference,
  UserSettings,
} from '@/domain/models';

export interface UseLocalePreferencesResult {
  settings: UserSettings | undefined;
  loading: boolean;
  setLanguage(language: LanguagePreference): Promise<void>;
  setNumberFormat(numberFormat: NumberFormatPreference): Promise<void>;
  setDateFormat(dateFormat: DateFormatPreference): Promise<void>;
}

/**
 * Reads the signed-in user's Settings and updates language, number format, and date format
 * independently — each setter patches only its own field, so changing one preference never
 * touches the stored values of the other two (localization spec). Assumes a `UserSettings`
 * row already exists for `userId` (created when the account is first set up).
 */
interface FetchState {
  userId: string;
  settings: UserSettings | undefined;
}

export function useLocalePreferences(userId: string): UseLocalePreferencesResult {
  const repository = useRepository();
  const [fetched, setFetched] = useState<FetchState | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    repository.settings.get(userId).then((result) => {
      if (cancelled) return;
      setFetched({ userId, settings: result });
    });
    return () => {
      cancelled = true;
    };
  }, [repository, userId]);

  const settings = fetched?.userId === userId ? fetched.settings : undefined;
  const loading = fetched?.userId !== userId;

  const patch = useCallback(
    async (
      update: Partial<Pick<UserSettings, 'language' | 'numberFormat' | 'dateFormat'>>,
    ): Promise<void> => {
      if (!settings) return;
      const next: UserSettings = { ...settings, ...update };
      setFetched({ userId, settings: next });
      await repository.settings.put(next);
    },
    [repository, settings, userId],
  );

  return {
    settings,
    loading,
    setLanguage: (language) => patch({ language }),
    setNumberFormat: (numberFormat) => patch({ numberFormat }),
    setDateFormat: (dateFormat) => patch({ dateFormat }),
  };
}

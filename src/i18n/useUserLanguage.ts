// CCA: 4
import { useEffect, useState } from 'react';
import { useRepository } from '@/data/repository-context';
import { seedSettingsIfFirstSignIn } from '@/data/seed';
import { DEFAULT_LANGUAGE, type LanguagePreference } from '@/domain/models';
import { getBrowserLocale } from './browser-locale';

/**
 * Resolves the signed-in user's persisted language (seeding a Settings row from the fallback
 * chain on first sign-in, per the localization spec) so the root `I18nProvider` renders with it
 * instead of the hardcoded default. Falls back to `DEFAULT_LANGUAGE` while signed out or loading.
 */
interface ResolvedLanguage {
  userId: string;
  language: LanguagePreference;
}

export function useUserLanguage(
  userId: string | null,
  googleAccountLocale: string | null,
): LanguagePreference {
  const repository = useRepository();
  const [resolved, setResolved] = useState<ResolvedLanguage | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    seedSettingsIfFirstSignIn(repository, userId, {
      googleAccountLocale,
      browserLocale: getBrowserLocale(),
    }).then((settings) => {
      if (!cancelled) setResolved({ userId, language: settings.language });
    });
    return () => {
      cancelled = true;
    };
  }, [repository, userId, googleAccountLocale]);

  return resolved?.userId === userId ? resolved.language : DEFAULT_LANGUAGE;
}

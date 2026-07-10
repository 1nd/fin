// CCA: 4
import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { LanguagePreference } from '@/domain/models';
import { getI18nInstance } from './i18next';

export function I18nProvider({
  language,
  children,
}: {
  language: LanguagePreference;
  children: React.ReactNode;
}) {
  const instance = getI18nInstance(language);

  useEffect(() => {
    if (instance.language !== language) {
      void instance.changeLanguage(language);
    }
  }, [instance, language]);

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}

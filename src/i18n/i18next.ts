// CCA: 3
import { DEFAULT_LANGUAGE, type LanguagePreference } from '@/domain/models';
import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './resources/en';
import id from './resources/id';

/** Idempotent — safe to call on every I18nProvider render. */
export function getI18nInstance(initialLanguage: LanguagePreference): i18n {
  if (!i18next.isInitialized) {
    void i18next.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        id: { translation: id },
      },
      lng: initialLanguage,
      fallbackLng: DEFAULT_LANGUAGE,
      interpolation: { escapeValue: false },
    });

    // Inline `resources/en` and `resources/id` make `init()` synchronous. If resources ever become
    // lazy-loaded, this fire-and-forget breaks — the provider must await init.
    if (!i18next.isInitialized) {
      throw new Error(
        'i18next no longer initializes synchronously; I18nProvider must handle async init',
      );
    }
  }
  return i18next;
}

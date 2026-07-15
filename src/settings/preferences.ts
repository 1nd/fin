// CCA: 1
export type Language = 'en' | 'id';
export type NumberFormatStyle = 'period-decimal' | 'comma-decimal';
export type DateFormatPattern = 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY';
export type Theme = 'dark';

export interface Preferences {
  language: Language;
  numberFormat: NumberFormatStyle;
  dateFormat: DateFormatPattern;
  theme: Theme;
}

export type PreferenceKey = keyof Preferences;

export const PREFERENCE_KEYS: readonly PreferenceKey[] = [
  'language',
  'numberFormat',
  'dateFormat',
  'theme',
];

const LANGUAGES: readonly Language[] = ['en', 'id'];
const NUMBER_FORMAT_STYLES: readonly NumberFormatStyle[] = ['period-decimal', 'comma-decimal'];
const DATE_FORMAT_PATTERNS: readonly DateFormatPattern[] = [
  'YYYY-MM-DD',
  'DD-MM-YYYY',
  'MM-DD-YYYY',
];
const THEMES: readonly Theme[] = ['dark'];

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

export function isNumberFormatStyle(value: string): value is NumberFormatStyle {
  return (NUMBER_FORMAT_STYLES as readonly string[]).includes(value);
}

export function isDateFormatPattern(value: string): value is DateFormatPattern {
  return (DATE_FORMAT_PATTERNS as readonly string[]).includes(value);
}

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

export const FALLBACK_PREFERENCES: Preferences = {
  language: 'en',
  numberFormat: 'period-decimal',
  dateFormat: 'YYYY-MM-DD',
  theme: 'dark',
};

const LOCALE_DEFAULTS: Record<string, Preferences> = {
  en: FALLBACK_PREFERENCES,
  id: {
    language: 'id',
    numberFormat: 'comma-decimal',
    dateFormat: 'YYYY-MM-DD',
    theme: 'dark',
  },
};

// Normalizes a BCP-47 locale (e.g. "id-ID") down to its base language
// subtag so both "id" and "id-ID" resolve to the same defaults.
export function localeDefaults(locale: string | null): Preferences | undefined {
  if (!locale) return undefined;
  const normalized = locale.toLowerCase();
  return LOCALE_DEFAULTS[normalized] ?? LOCALE_DEFAULTS[normalized.split('-')[0]];
}

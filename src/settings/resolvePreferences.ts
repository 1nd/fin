// CCA: 1
import {
  FALLBACK_PREFERENCES,
  isDateFormatPattern,
  isLanguage,
  isNumberFormatStyle,
  isTheme,
  localeDefaults,
  type PreferenceKey,
  type Preferences,
} from './preferences';

export type PreferenceOverrides = Partial<Record<PreferenceKey, string>>;

// Cascade: account locale -> browser locale -> built-in fallback, with a
// stored override always winning over whichever default applies.
export function resolvePreferences(
  accountLocale: string | null,
  browserLocale: string | null,
  overrides: PreferenceOverrides,
): Preferences {
  const base =
    localeDefaults(accountLocale) ?? localeDefaults(browserLocale) ?? FALLBACK_PREFERENCES;

  return {
    language: pick(overrides.language, isLanguage, base.language),
    numberFormat: pick(overrides.numberFormat, isNumberFormatStyle, base.numberFormat),
    dateFormat: pick(overrides.dateFormat, isDateFormatPattern, base.dateFormat),
    theme: pick(overrides.theme, isTheme, base.theme),
  };
}

function pick<T extends string>(
  override: string | undefined,
  isValid: (value: string) => value is T,
  fallback: T,
): T {
  return override !== undefined && isValid(override) ? override : fallback;
}

// CCA: 2
import {
  DEFAULT_DATE_FORMAT,
  DEFAULT_LANGUAGE,
  DEFAULT_NUMBER_FORMAT,
  type DateFormatPreference,
  type LanguagePreference,
  type NumberFormatPreference,
} from '@/domain/models';

export interface LocaleFallbackSource {
  /** BCP-47 locale string, if determinable from the signed-in Google account. */
  googleAccountLocale?: string | null;
  /** BCP-47 locale string, if determinable from the browser. */
  browserLocale?: string | null;
}

function firstDeterminableLocale(source: LocaleFallbackSource): string | null {
  return source.googleAccountLocale ?? source.browserLocale ?? null;
}

function isIndonesian(locale: string | null): boolean {
  return !!locale && locale.toLowerCase().startsWith('id');
}

function isEnglish(locale: string | null): boolean {
  return !!locale && locale.toLowerCase().startsWith('en');
}

function isUnitedStatesEnglish(locale: string | null): boolean {
  return !!locale && locale.toLowerCase() === 'en-us';
}

/**
 * Google account locale -> browser locale -> hardcoded default, per preference (localization spec).
 * Only ever called when a preference has no stored Settings value yet — the result is meant to be
 * seeded once, not re-derived on every render.
 */
export function resolveLanguage(source: LocaleFallbackSource): LanguagePreference {
  return isIndonesian(firstDeterminableLocale(source)) ? 'id' : DEFAULT_LANGUAGE;
}

export function resolveNumberFormat(source: LocaleFallbackSource): NumberFormatPreference {
  return isEnglish(firstDeterminableLocale(source)) ? 'en-US' : DEFAULT_NUMBER_FORMAT;
}

export function resolveDateFormat(source: LocaleFallbackSource): DateFormatPreference {
  const locale = firstDeterminableLocale(source);
  if (isUnitedStatesEnglish(locale)) return 'MM-DD-YYYY';
  if (isIndonesian(locale)) return 'DD-MM-YYYY';
  return DEFAULT_DATE_FORMAT;
}

export interface ResolvedLocalePreferences {
  language: LanguagePreference;
  numberFormat: NumberFormatPreference;
  dateFormat: DateFormatPreference;
}

/** Resolves all three preferences independently — one preference's fallback never affects another's result. */
export function resolveInitialLocalePreferences(
  source: LocaleFallbackSource,
): ResolvedLocalePreferences {
  return {
    language: resolveLanguage(source),
    numberFormat: resolveNumberFormat(source),
    dateFormat: resolveDateFormat(source),
  };
}

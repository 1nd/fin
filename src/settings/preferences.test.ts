import { describe, expect, it } from 'vitest';
import {
  FALLBACK_PREFERENCES,
  isDateFormatPattern,
  isLanguage,
  isNumberFormatStyle,
  isTheme,
  localeDefaults,
} from './preferences';

describe('FALLBACK_PREFERENCES', () => {
  it('is the built-in last resort', () => {
    expect(FALLBACK_PREFERENCES).toEqual({
      language: 'en',
      numberFormat: 'period-decimal',
      dateFormat: 'YYYY-MM-DD',
      theme: 'dark',
    });
  });
});

describe('localeDefaults', () => {
  it('maps a recognized language-region locale to its defaults', () => {
    expect(localeDefaults('id-ID')).toEqual({
      language: 'id',
      numberFormat: 'comma-decimal',
      dateFormat: 'YYYY-MM-DD',
      theme: 'dark',
    });
  });

  it('maps a bare language subtag', () => {
    expect(localeDefaults('en')).toEqual(FALLBACK_PREFERENCES);
  });

  it('is case-insensitive', () => {
    expect(localeDefaults('ID-id')?.language).toBe('id');
  });

  it('returns undefined for an unrecognized locale', () => {
    expect(localeDefaults('fr-FR')).toBeUndefined();
  });

  it('returns undefined for a null locale', () => {
    expect(localeDefaults(null)).toBeUndefined();
  });
});

describe('type guards', () => {
  it.each(['en', 'id'])('accepts %s as a language', (value) => {
    expect(isLanguage(value)).toBe(true);
  });

  it('rejects an unsupported language', () => {
    expect(isLanguage('fr')).toBe(false);
  });

  it.each(['period-decimal', 'comma-decimal'])('accepts %s as a number format', (value) => {
    expect(isNumberFormatStyle(value)).toBe(true);
  });

  it('rejects an unsupported number format', () => {
    expect(isNumberFormatStyle('space-decimal')).toBe(false);
  });

  it.each(['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'])('accepts %s as a date format', (value) => {
    expect(isDateFormatPattern(value)).toBe(true);
  });

  it('rejects an unsupported date format', () => {
    expect(isDateFormatPattern('YYYY/MM/DD')).toBe(false);
  });

  it('accepts dark as a theme', () => {
    expect(isTheme('dark')).toBe(true);
  });

  it('rejects an unsupported theme', () => {
    expect(isTheme('light')).toBe(false);
  });
});

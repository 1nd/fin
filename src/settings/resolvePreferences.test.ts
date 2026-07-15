import { describe, expect, it } from 'vitest';
import { FALLBACK_PREFERENCES } from './preferences';
import { resolvePreferences } from './resolvePreferences';

describe('resolvePreferences', () => {
  it('falls back to browser locale defaults when there is no account locale', () => {
    expect(resolvePreferences(null, 'id-ID', {})).toEqual({
      language: 'id',
      numberFormat: 'comma-decimal',
      dateFormat: 'YYYY-MM-DD',
      theme: 'dark',
    });
  });

  it('prefers account locale over browser locale', () => {
    const result = resolvePreferences('id-ID', 'en-US', {});
    expect(result.language).toBe('id');
  });

  it('falls back to the built-in default when both locales are unrecognized', () => {
    expect(resolvePreferences('fr-FR', 'de-DE', {})).toEqual(FALLBACK_PREFERENCES);
  });

  it('falls back to the built-in default when both locales are null', () => {
    expect(resolvePreferences(null, null, {})).toEqual(FALLBACK_PREFERENCES);
  });

  it('lets a stored override beat the cascade', () => {
    const result = resolvePreferences(null, 'id-ID', { language: 'en' });
    expect(result.language).toBe('en');
    // Other preferences remain cascade-derived, independent of the override.
    expect(result.numberFormat).toBe('comma-decimal');
  });

  it('ignores an override holding an unrecognized value', () => {
    const result = resolvePreferences(null, 'id-ID', { language: 'fr' });
    expect(result.language).toBe('id');
  });
});

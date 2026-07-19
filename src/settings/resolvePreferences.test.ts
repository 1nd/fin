import { describe, expect, it } from 'vitest';
import { FALLBACK_PREFERENCES } from './preferences';
import { resolvePreferences } from './resolvePreferences';

describe('resolvePreferences', () => {
  it('resolves defaults from the browser locale', () => {
    expect(resolvePreferences('id-ID', {})).toEqual({
      language: 'id',
      numberFormat: 'comma-decimal',
      dateFormat: 'YYYY-MM-DD',
      theme: 'dark',
    });
  });

  it('falls back to the built-in default when the browser locale is unrecognized', () => {
    expect(resolvePreferences('fr-FR', {})).toEqual(FALLBACK_PREFERENCES);
  });

  it('falls back to the built-in default when the browser locale is null', () => {
    expect(resolvePreferences(null, {})).toEqual(FALLBACK_PREFERENCES);
  });

  it('lets a stored override beat the cascade', () => {
    const result = resolvePreferences('id-ID', { language: 'en' });
    expect(result.language).toBe('en');
    // Other preferences remain cascade-derived, independent of the override.
    expect(result.numberFormat).toBe('comma-decimal');
  });

  it('ignores an override holding an unrecognized value', () => {
    const result = resolvePreferences('id-ID', { language: 'fr' });
    expect(result.language).toBe('id');
  });
});

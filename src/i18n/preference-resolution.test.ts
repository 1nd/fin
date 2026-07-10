import {
  resolveDateFormat,
  resolveInitialLocalePreferences,
  resolveLanguage,
  resolveNumberFormat,
  type LocaleFallbackSource,
} from './preference-resolution';

describe('resolveLanguage', () => {
  it('uses the Google account locale when determinable', () => {
    expect(resolveLanguage({ googleAccountLocale: 'id-ID' })).toBe('id');
  });

  it('falls back to the browser locale when the Google account locale is not determinable', () => {
    expect(resolveLanguage({ googleAccountLocale: null, browserLocale: 'id-ID' })).toBe('id');
  });

  it('prefers the Google account locale over the browser locale when both are determinable', () => {
    expect(resolveLanguage({ googleAccountLocale: 'en-US', browserLocale: 'id-ID' })).toBe('en');
    expect(resolveLanguage({ googleAccountLocale: 'id-ID', browserLocale: 'en-US' })).toBe('id');
  });

  it('falls back to the hardcoded default (English) when neither locale is determinable', () => {
    expect(resolveLanguage({})).toBe('en');
    expect(resolveLanguage({ googleAccountLocale: null, browserLocale: null })).toBe('en');
  });
});

describe('resolveNumberFormat', () => {
  it('resolves the US number format from an English locale', () => {
    expect(resolveNumberFormat({ googleAccountLocale: 'en-US' })).toBe('en-US');
  });

  it('falls back to the browser locale when the Google account locale is not determinable', () => {
    expect(resolveNumberFormat({ googleAccountLocale: null, browserLocale: 'en-US' })).toBe(
      'en-US',
    );
  });

  it('falls back to the hardcoded default (Indonesian) when neither locale is determinable', () => {
    expect(resolveNumberFormat({})).toBe('id-ID');
  });

  it('falls back to the hardcoded default (Indonesian) for a non-English, non-determinable-as-US locale', () => {
    expect(resolveNumberFormat({ googleAccountLocale: 'id-ID' })).toBe('id-ID');
  });
});

describe('resolveDateFormat', () => {
  it('resolves MM-DD-YYYY specifically for US English', () => {
    expect(resolveDateFormat({ googleAccountLocale: 'en-US' })).toBe('MM-DD-YYYY');
  });

  it('resolves DD-MM-YYYY for Indonesian', () => {
    expect(resolveDateFormat({ googleAccountLocale: 'id-ID' })).toBe('DD-MM-YYYY');
  });

  it('falls back to the browser locale when the Google account locale is not determinable', () => {
    expect(resolveDateFormat({ googleAccountLocale: null, browserLocale: 'en-US' })).toBe(
      'MM-DD-YYYY',
    );
  });

  it('falls back to the hardcoded default (YYYY-MM-DD) for English locales other than en-US', () => {
    expect(resolveDateFormat({ googleAccountLocale: 'en-GB' })).toBe('YYYY-MM-DD');
  });

  it('falls back to the hardcoded default (YYYY-MM-DD) when neither locale is determinable', () => {
    expect(resolveDateFormat({})).toBe('YYYY-MM-DD');
  });
});

describe('resolveInitialLocalePreferences', () => {
  it('resolves each preference independently from the same source', () => {
    const source: LocaleFallbackSource = { googleAccountLocale: null, browserLocale: 'en-US' };
    expect(resolveInitialLocalePreferences(source)).toEqual({
      language: 'en',
      numberFormat: 'en-US',
      dateFormat: 'MM-DD-YYYY',
    });
  });

  it('resolves each preference to its own hardcoded default when nothing is determinable', () => {
    expect(resolveInitialLocalePreferences({})).toEqual({
      language: 'en',
      numberFormat: 'id-ID',
      dateFormat: 'YYYY-MM-DD',
    });
  });

  it('lets one preference land on its default while the others resolve from locale', () => {
    // en-GB determines language and number format but has no dedicated date format rule,
    // so date format alone falls through to its hardcoded default.
    const source: LocaleFallbackSource = { googleAccountLocale: 'en-GB' };
    expect(resolveInitialLocalePreferences(source)).toEqual({
      language: 'en',
      numberFormat: 'en-US',
      dateFormat: 'YYYY-MM-DD',
    });
  });
});

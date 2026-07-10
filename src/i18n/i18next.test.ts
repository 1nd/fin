import { getI18nInstance } from './i18next';

describe('getI18nInstance', () => {
  it('returns a synchronously initialized instance', () => {
    const instance = getI18nInstance('en');
    expect(instance.isInitialized).toBe(true);
  });

  it('is idempotent -- repeated calls return the same, still-initialized instance', () => {
    const first = getI18nInstance('en');
    const second = getI18nInstance('id');
    expect(second).toBe(first);
    expect(second.isInitialized).toBe(true);
  });
});

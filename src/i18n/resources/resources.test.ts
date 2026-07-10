import en from './en';
import id from './id';

function collectKeyPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') {
    return [prefix];
  }
  return Object.keys(value as Record<string, unknown>)
    .flatMap((key) =>
      collectKeyPaths((value as Record<string, unknown>)[key], prefix ? `${prefix}.${key}` : key),
    )
    .sort();
}

describe('en/id translation resources', () => {
  it('expose the identical set of translation keys', () => {
    const enKeys = collectKeyPaths(en);
    const idKeys = collectKeyPaths(id);

    expect(enKeys.length).toBeGreaterThan(0);
    expect(idKeys).toEqual(enKeys);
  });
});

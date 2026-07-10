import { themeRegistry } from './registry';

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

describe('themeRegistry', () => {
  it('exposes the identical token key set for every registered theme', () => {
    const names = Object.keys(themeRegistry) as (keyof typeof themeRegistry)[];
    expect(names.length).toBeGreaterThan(0);

    const referenceKeys = collectKeyPaths(themeRegistry[names[0]]);

    for (const name of names) {
      expect(collectKeyPaths(themeRegistry[name])).toEqual(referenceKeys);
    }
  });
});

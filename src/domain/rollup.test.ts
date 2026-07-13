import type { Category, Entry } from './models';
import { computeCategoryRollups } from './rollup';

function makeCategory(overrides: Partial<Category> & Pick<Category, 'id'>): Category {
  return {
    userId: 'user-a',
    entityType: 'expense',
    name: 'Category',
    parentId: null,
    isSystem: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<Entry> & Pick<Entry, 'id' | 'categoryId'>): Entry {
  return {
    userId: 'user-a',
    entityType: 'expense',
    amount: 100,
    currency: 'USD',
    fxRateToBase: 1,
    date: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const identity = (entry: Entry): number => entry.amount;

describe('computeCategoryRollups', () => {
  it('includes a category own directly-attached entries', () => {
    const categories = [makeCategory({ id: 'food' })];
    const entries = [
      makeEntry({ id: 'e1', categoryId: 'food', amount: 10 }),
      makeEntry({ id: 'e2', categoryId: 'food', amount: 5 }),
    ];

    const rollups = computeCategoryRollups(categories, entries, identity);

    expect(rollups.get('food')).toBe(15);
  });

  it('rolls up descendant totals into every ancestor, recursively', () => {
    const categories = [
      makeCategory({ id: 'food', parentId: null }),
      makeCategory({ id: 'eating-out', parentId: 'food' }),
      makeCategory({ id: 'coffee', parentId: 'eating-out' }),
    ];
    const entries = [
      makeEntry({ id: 'e1', categoryId: 'food', amount: 10 }),
      makeEntry({ id: 'e2', categoryId: 'eating-out', amount: 20 }),
      makeEntry({ id: 'e3', categoryId: 'coffee', amount: 5 }),
    ];

    const rollups = computeCategoryRollups(categories, entries, identity);

    expect(rollups.get('coffee')).toBe(5);
    expect(rollups.get('eating-out')).toBe(25);
    expect(rollups.get('food')).toBe(35);
  });

  it('gives categories with no entries a zero total', () => {
    const categories = [makeCategory({ id: 'food' })];
    const rollups = computeCategoryRollups(categories, [], identity);
    expect(rollups.get('food')).toBe(0);
  });

  it('applies the valueOf callback for base-currency conversion, not the raw amount', () => {
    const categories = [makeCategory({ id: 'food' })];
    const entries = [makeEntry({ id: 'e1', categoryId: 'food', amount: 10, fxRateToBase: 3 })];

    const rollups = computeCategoryRollups(categories, entries, (e) => e.amount * e.fxRateToBase);

    expect(rollups.get('food')).toBe(30);
  });
});

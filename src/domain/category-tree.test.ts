import type { Category, Entry } from './models';
import {
  buildCategoryTree,
  computeDeletionReassignment,
  findUncategorized,
  isSameOrDescendant,
  ReparentCycleError,
  validateReparent,
} from './category-tree';

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

describe('findUncategorized', () => {
  it('finds the system category for an entity type', () => {
    const uncategorized = makeCategory({ id: 'unc-expense', isSystem: true });
    const categories = [uncategorized, makeCategory({ id: 'food', entityType: 'expense' })];
    expect(findUncategorized(categories, 'expense')).toBe(uncategorized);
  });

  it('returns undefined when no system category exists for the entity type', () => {
    const categories = [makeCategory({ id: 'food', entityType: 'expense' })];
    expect(findUncategorized(categories, 'income')).toBeUndefined();
  });
});

describe('isSameOrDescendant', () => {
  const categories = [
    makeCategory({ id: 'food', parentId: null }),
    makeCategory({ id: 'eating-out', parentId: 'food' }),
    makeCategory({ id: 'coffee', parentId: 'eating-out' }),
    makeCategory({ id: 'transport', parentId: null }),
  ];

  it('is true when candidate is the ancestor itself', () => {
    expect(isSameOrDescendant(categories, 'food', 'food')).toBe(true);
  });

  it('is true when candidate is a nested descendant', () => {
    expect(isSameOrDescendant(categories, 'coffee', 'food')).toBe(true);
  });

  it('is false for unrelated branches', () => {
    expect(isSameOrDescendant(categories, 'transport', 'food')).toBe(false);
  });
});

describe('validateReparent', () => {
  const categories = [
    makeCategory({ id: 'food', parentId: null }),
    makeCategory({ id: 'eating-out', parentId: 'food' }),
    makeCategory({ id: 'coffee', parentId: 'eating-out' }),
  ];

  it('allows moving a category to the root', () => {
    expect(() => validateReparent(categories, 'eating-out', null)).not.toThrow();
  });

  it('allows moving a category under an unrelated category', () => {
    expect(() => validateReparent(categories, 'coffee', 'food')).not.toThrow();
  });

  it('rejects reparenting a category under itself', () => {
    expect(() => validateReparent(categories, 'food', 'food')).toThrow(ReparentCycleError);
  });

  it('rejects reparenting a category under its own descendant', () => {
    expect(() => validateReparent(categories, 'food', 'coffee')).toThrow(ReparentCycleError);
  });
});

describe('computeDeletionReassignment', () => {
  it('reassigns entries and children to the parent when one exists', () => {
    const categories = [
      makeCategory({ id: 'food', parentId: null }),
      makeCategory({ id: 'eating-out', parentId: 'food' }),
      makeCategory({ id: 'coffee', parentId: 'eating-out' }),
    ];
    const entries = [makeEntry({ id: 'e1', categoryId: 'eating-out' })];

    const result = computeDeletionReassignment(categories, entries, 'eating-out');

    expect(result.reassignedToId).toBe('food');
    expect(result.reparentedCategories).toEqual([
      expect.objectContaining({ id: 'coffee', parentId: 'food' }),
    ]);
    expect(result.reassignedEntries).toEqual([
      expect.objectContaining({ id: 'e1', categoryId: 'food' }),
    ]);
  });

  it('falls back to Uncategorized when deleting a root-level category', () => {
    const categories = [
      makeCategory({ id: 'unc-expense', isSystem: true, name: 'Uncategorized' }),
      makeCategory({ id: 'food', parentId: null }),
      makeCategory({ id: 'eating-out', parentId: 'food' }),
    ];
    const entries = [makeEntry({ id: 'e1', categoryId: 'food' })];

    const result = computeDeletionReassignment(categories, entries, 'food');

    expect(result.reassignedToId).toBe('unc-expense');
    expect(result.reparentedCategories).toEqual([
      expect.objectContaining({ id: 'eating-out', parentId: 'unc-expense' }),
    ]);
    expect(result.reassignedEntries).toEqual([
      expect.objectContaining({ id: 'e1', categoryId: 'unc-expense' }),
    ]);
  });

  it('throws when no Uncategorized category exists for a root-level deletion', () => {
    const categories = [makeCategory({ id: 'food', parentId: null })];
    expect(() => computeDeletionReassignment(categories, [], 'food')).toThrow(
      /No Uncategorized category found/,
    );
  });

  it('refuses to delete the Uncategorized category itself', () => {
    const categories = [makeCategory({ id: 'unc-expense', isSystem: true })];
    expect(() => computeDeletionReassignment(categories, [], 'unc-expense')).toThrow(
      'Cannot delete the Uncategorized category',
    );
  });

  it('throws when the target category does not exist', () => {
    expect(() => computeDeletionReassignment([], [], 'missing')).toThrow('Category not found');
  });
});

describe('buildCategoryTree', () => {
  it('nests categories under their parents, sorted by name', () => {
    const categories = [
      makeCategory({ id: 'food', name: 'Food', parentId: null }),
      makeCategory({ id: 'transport', name: 'Transport', parentId: null }),
      makeCategory({ id: 'coffee', name: 'Coffee', parentId: 'food' }),
      makeCategory({ id: 'groceries', name: 'Groceries', parentId: 'food' }),
    ];

    const tree = buildCategoryTree(categories, 'expense');

    expect(tree.map((node) => node.category.name)).toEqual(['Food', 'Transport']);
    const foodNode = tree.find((node) => node.category.id === 'food')!;
    expect(foodNode.children.map((node) => node.category.name)).toEqual(['Coffee', 'Groceries']);
  });

  it('excludes the Uncategorized system category', () => {
    const categories = [
      makeCategory({ id: 'unc-expense', name: 'Uncategorized', isSystem: true }),
      makeCategory({ id: 'food', name: 'Food', parentId: null }),
    ];

    const tree = buildCategoryTree(categories, 'expense');

    expect(tree.map((node) => node.category.id)).toEqual(['food']);
  });

  it('scopes the tree to the requested entity type', () => {
    const categories = [
      makeCategory({ id: 'food', name: 'Food', entityType: 'expense', parentId: null }),
      makeCategory({ id: 'salary', name: 'Salary', entityType: 'income', parentId: null }),
    ];

    expect(buildCategoryTree(categories, 'expense').map((n) => n.category.id)).toEqual(['food']);
    expect(buildCategoryTree(categories, 'income').map((n) => n.category.id)).toEqual(['salary']);
  });
});

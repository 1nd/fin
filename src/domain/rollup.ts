// CCA: 1
import type { Category, Entry } from './models';
import { toBaseAmount } from './fx';

/**
 * A category's rollup value is its own directly-attached entries plus the
 * rolled-up value of every descendant category, computed recursively by
 * walking the in-memory tree (design Decision 3).
 */
export function computeCategoryRollups(
  categories: Category[],
  entries: Entry[],
): Map<string, number> {
  const ownTotals = new Map<string, number>();
  for (const category of categories) ownTotals.set(category.id, 0);
  for (const entry of entries) {
    const current = ownTotals.get(entry.categoryId) ?? 0;
    ownTotals.set(entry.categoryId, current + toBaseAmount(entry));
  }

  const childrenByParent = new Map<string, string[]>();
  for (const category of categories) {
    if (category.parentId) {
      const list = childrenByParent.get(category.parentId) ?? [];
      list.push(category.id);
      childrenByParent.set(category.parentId, list);
    }
  }

  const rollups = new Map<string, number>();
  function computeFor(categoryId: string): number {
    const cached = rollups.get(categoryId);
    if (cached !== undefined) return cached;
    let total = ownTotals.get(categoryId) ?? 0;
    for (const childId of childrenByParent.get(categoryId) ?? []) {
      total += computeFor(childId);
    }
    rollups.set(categoryId, total);
    return total;
  }

  for (const category of categories) computeFor(category.id);
  return rollups;
}

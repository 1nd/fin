// CCA: 1
import type { Category, Entry, EntityType } from './models';

export function findUncategorized(
  categories: Category[],
  entityType: EntityType,
): Category | undefined {
  return categories.find((c) => c.entityType === entityType && c.isSystem);
}

/** True if `candidateId` is `ancestorId` itself or a descendant of it. */
export function isSameOrDescendant(
  categories: Category[],
  candidateId: string,
  ancestorId: string,
): boolean {
  let current: Category | undefined = categories.find((c) => c.id === candidateId);
  while (current) {
    if (current.id === ancestorId) return true;
    current = current.parentId ? categories.find((c) => c.id === current!.parentId) : undefined;
  }
  return false;
}

export class ReparentCycleError extends Error {
  constructor() {
    super('Cannot reparent a category under itself or one of its own descendants');
    this.name = 'ReparentCycleError';
  }
}

export function validateReparent(
  categories: Category[],
  categoryId: string,
  newParentId: string | null,
): void {
  if (newParentId === null) return;
  if (newParentId === categoryId || isSameOrDescendant(categories, newParentId, categoryId)) {
    throw new ReparentCycleError();
  }
}

export interface DeletionReassignment {
  /** Categories with an updated parentId (the deleted category's direct children). */
  reparentedCategories: Category[];
  /** Entries with an updated categoryId (the deleted category's direct entries). */
  reassignedEntries: Entry[];
  /** The id entries/children were reassigned to (parent, or the entity type's Uncategorized). */
  reassignedToId: string;
}

/**
 * Computes the reassignment needed when deleting `categoryId`: its direct
 * entries and direct child categories move to its parent, or to the entity
 * type's Uncategorized category if it has no parent (Decision 4).
 */
export function computeDeletionReassignment(
  categories: Category[],
  entries: Entry[],
  categoryId: string,
): DeletionReassignment {
  const target = categories.find((c) => c.id === categoryId);
  if (!target) throw new Error(`Category not found: ${categoryId}`);
  if (target.isSystem) throw new Error('Cannot delete the Uncategorized category');

  let reassignedToId = target.parentId;
  if (!reassignedToId) {
    const uncategorized = findUncategorized(categories, target.entityType);
    if (!uncategorized) {
      throw new Error(`No Uncategorized category found for entity type ${target.entityType}`);
    }
    reassignedToId = uncategorized.id;
  }

  const reparentedCategories = categories
    .filter((c) => c.parentId === categoryId)
    .map((c) => ({ ...c, parentId: reassignedToId }));

  const reassignedEntries = entries
    .filter((e) => e.categoryId === categoryId)
    .map((e) => ({ ...e, categoryId: reassignedToId! }));

  return { reparentedCategories, reassignedEntries, reassignedToId };
}

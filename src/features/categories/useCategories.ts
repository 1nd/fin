// CCA: 2
import { useIdGenerator } from '@/data/id-generator/id-generator-context';
import { useRepository } from '@/data/repository-context';
import { seedIfFirstSignIn } from '@/data/seed';
import { computeDeletionReassignment, validateReparent } from '@/domain/category-tree';
import { toBaseAmount } from '@/domain/fx';
import type { Category, EntityType, Entry } from '@/domain/models';
import { computeCategoryRollups } from '@/domain/rollup';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface FetchState {
  userId: string;
  categories: Category[];
  entries: Entry[];
}

export interface UseCategoriesResult {
  categories: Category[];
  /** Category id -> base-currency rollup total (own entries + descendants). */
  rollups: Map<string, number>;
  loading: boolean;
  createCategory(entityType: EntityType, name: string, parentId: string | null): Promise<void>;
  renameCategory(id: string, name: string): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  reparentCategory(id: string, newParentId: string | null): Promise<void>;
}

/**
 * Loads a user's categories (seeding recommended starter categories on first
 * use, Task 6.6) and exposes CRUD operations that go through the domain
 * layer's reparent-cycle validation and deletion-reassignment rules (Tasks
 * 6.2, 6.4), plus rollup totals (Task 6.3).
 */
export function useCategories(userId: string): UseCategoriesResult {
  const repository = useRepository();
  const generateId = useIdGenerator();
  const [state, setState] = useState<FetchState | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await seedIfFirstSignIn(repository, userId, generateId);
      const [categories, entries] = await Promise.all([
        repository.categories.listByUser(userId),
        repository.entries.listByUser(userId),
      ]);
      if (!cancelled) setState({ userId, categories, entries });
    })();
    return () => {
      cancelled = true;
    };
  }, [repository, userId, generateId]);

  const fresh = state?.userId === userId;
  const categories = useMemo(() => (fresh ? state!.categories : []), [fresh, state]);
  const entries = useMemo(() => (fresh ? state!.entries : []), [fresh, state]);
  const loading = !fresh;
  const rollups = computeCategoryRollups(categories, entries, toBaseAmount);

  const createCategory = useCallback(
    async (entityType: EntityType, name: string, parentId: string | null) => {
      const category: Category = {
        id: generateId(),
        userId,
        entityType,
        name,
        parentId,
        isSystem: false,
        createdAt: new Date().toISOString(),
      };
      await repository.categories.create(category);
      setState((prev) =>
        prev && prev.userId === userId
          ? { ...prev, categories: [...prev.categories, category] }
          : prev,
      );
    },
    [repository, userId, generateId],
  );

  const renameCategory = useCallback(
    async (id: string, name: string) => {
      const existing = categories.find((c) => c.id === id);
      if (!existing) return;
      const renamed = { ...existing, name };
      await repository.categories.update(renamed);
      setState((prev) =>
        prev && prev.userId === userId
          ? { ...prev, categories: prev.categories.map((c) => (c.id === id ? renamed : c)) }
          : prev,
      );
    },
    [repository, userId, categories],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const { reparentedCategories, reassignedEntries } = computeDeletionReassignment(
        categories,
        entries,
        id,
      );
      await Promise.all([
        repository.categories.bulkUpsert(reparentedCategories),
        repository.entries.bulkUpsert(reassignedEntries),
        repository.categories.delete(id),
      ]);
      setState((prev) => {
        if (!prev || prev.userId !== userId) return prev;
        const reparented = new Map(reparentedCategories.map((c) => [c.id, c]));
        const reassigned = new Map(reassignedEntries.map((e) => [e.id, e]));
        return {
          ...prev,
          categories: prev.categories
            .filter((c) => c.id !== id)
            .map((c) => reparented.get(c.id) ?? c),
          entries: prev.entries.map((e) => reassigned.get(e.id) ?? e),
        };
      });
    },
    [repository, userId, categories, entries],
  );

  const reparentCategory = useCallback(
    async (id: string, newParentId: string | null) => {
      validateReparent(categories, id, newParentId);
      const existing = categories.find((c) => c.id === id);
      if (!existing) return;
      const reparented = { ...existing, parentId: newParentId };
      await repository.categories.update(reparented);
      setState((prev) =>
        prev && prev.userId === userId
          ? { ...prev, categories: prev.categories.map((c) => (c.id === id ? reparented : c)) }
          : prev,
      );
    },
    [repository, userId, categories],
  );

  return {
    categories,
    rollups,
    loading,
    createCategory,
    renameCategory,
    deleteCategory,
    reparentCategory,
  };
}

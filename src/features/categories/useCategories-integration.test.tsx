import { IdGeneratorContext } from '@/data/id-generator/id-generator-context';
import { webIdGenerator } from '@/data/id-generator/web-id-generator';
import { IndexedDbStorageRepository } from '@/data/indexeddb/IndexedDbStorageRepository';
import { RepositoryContext } from '@/data/repository-context';
import { ReparentCycleError } from '@/domain/category-tree';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import React from 'react';
import { useCategories } from './useCategories';

describe('useCategories', () => {
  let repository: IndexedDbStorageRepository;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    repository = new IndexedDbStorageRepository();
  });

  function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <RepositoryContext.Provider value={repository}>
        <IdGeneratorContext.Provider value={webIdGenerator}>{children}</IdGeneratorContext.Provider>
      </RepositoryContext.Provider>
    );
  }

  it('seeds starter categories on first load, including a hidden Uncategorized per entity type', async () => {
    const { result } = await renderHook(() => useCategories('user-a'), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.categories.length).toBeGreaterThan(0);
    const uncategorized = result.current.categories.filter((c) => c.isSystem);
    expect(uncategorized).toHaveLength(4);
    expect(uncategorized.every((c) => c.name === 'Uncategorized')).toBe(true);
  });

  it('does not reseed on a later load for the same user', async () => {
    const { result, rerender } = await renderHook(() => useCategories('user-a'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    const firstCount = result.current.categories.length;

    await rerender({});
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.categories).toHaveLength(firstCount);
  });

  it('creates a category and persists it', async () => {
    const { result } = await renderHook(() => useCategories('user-a'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createCategory('expense', 'Hobbies', null);
    });

    expect(result.current.categories.some((c) => c.name === 'Hobbies')).toBe(true);
    const stored = await repository.categories.listByUser('user-a');
    expect(stored.some((c) => c.name === 'Hobbies')).toBe(true);
  });

  it('renames a category', async () => {
    const { result } = await renderHook(() => useCategories('user-a'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createCategory('expense', 'Hobbies', null);
    });
    const created = result.current.categories.find((c) => c.name === 'Hobbies')!;

    await act(async () => {
      await result.current.renameCategory(created.id, 'Games');
    });

    expect(result.current.categories.find((c) => c.id === created.id)?.name).toBe('Games');
  });

  it('reparents a category and rejects cycles', async () => {
    const { result } = await renderHook(() => useCategories('user-a'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createCategory('expense', 'Parent', null);
    });
    const parent = result.current.categories.find((c) => c.name === 'Parent')!;

    await act(async () => {
      await result.current.createCategory('expense', 'Child', null);
    });
    const child = result.current.categories.find((c) => c.name === 'Child')!;

    await act(async () => {
      await result.current.reparentCategory(child.id, parent.id);
    });
    expect(result.current.categories.find((c) => c.id === child.id)?.parentId).toBe(parent.id);

    await expect(
      act(async () => {
        await result.current.reparentCategory(parent.id, child.id);
      }),
    ).rejects.toThrow(ReparentCycleError);
  });

  it('deletes a category, reassigning its children to its parent and entries with it', async () => {
    const { result } = await renderHook(() => useCategories('user-a'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createCategory('expense', 'Food', null);
    });
    const food = result.current.categories.find((c) => c.name === 'Food')!;

    await act(async () => {
      await result.current.createCategory('expense', 'Coffee', food.id);
    });
    const coffee = result.current.categories.find((c) => c.name === 'Coffee')!;

    const entry = {
      id: 'entry-1',
      userId: 'user-a',
      categoryId: coffee.id,
      entityType: 'expense' as const,
      amount: 5,
      currency: 'USD',
      fxRateToBase: 1,
      date: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    await repository.entries.create(entry);

    const { result: reloaded } = await renderHook(() => useCategories('user-a'), { wrapper });
    await waitFor(() => expect(reloaded.current.loading).toBe(false));

    await act(async () => {
      await reloaded.current.deleteCategory(coffee.id);
    });

    expect(reloaded.current.categories.some((c) => c.id === coffee.id)).toBe(false);
    const remainingEntries = await repository.entries.listByUser('user-a');
    expect(remainingEntries.find((e) => e.id === 'entry-1')?.categoryId).toBe(food.id);
  });

  it('reassigns deletion of a root category to Uncategorized and computes rollups', async () => {
    const { result } = await renderHook(() => useCategories('user-a'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createCategory('expense', 'Food', null);
    });
    const food = result.current.categories.find((c) => c.name === 'Food')!;
    const uncategorized = result.current.categories.find(
      (c) => c.entityType === 'expense' && c.isSystem,
    )!;

    const entry = {
      id: 'entry-1',
      userId: 'user-a',
      categoryId: food.id,
      entityType: 'expense' as const,
      amount: 20,
      currency: 'USD',
      fxRateToBase: 2,
      date: '2026-01-01',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    await repository.entries.create(entry);

    const { result: reloaded } = await renderHook(() => useCategories('user-a'), { wrapper });
    await waitFor(() => expect(reloaded.current.loading).toBe(false));
    expect(reloaded.current.rollups.get(food.id)).toBe(40);

    await act(async () => {
      await reloaded.current.deleteCategory(food.id);
    });

    expect(reloaded.current.categories.some((c) => c.id === food.id)).toBe(false);
    expect(reloaded.current.rollups.get(uncategorized.id)).toBe(40);
  });
});

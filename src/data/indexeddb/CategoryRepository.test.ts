import type { Category } from '@/domain/models';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { IndexedDbCategoryRepository } from './CategoryRepository';
import { createDbProvider } from './db';

function makeCategory(overrides: Partial<Category> & Pick<Category, 'id' | 'userId'>): Category {
  return {
    entityType: 'expense',
    name: 'Food',
    parentId: null,
    isSystem: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('IndexedDbCategoryRepository', () => {
  let repo: IndexedDbCategoryRepository;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    repo = new IndexedDbCategoryRepository(createDbProvider());
  });

  it('round-trips create, update, and delete', async () => {
    const category = makeCategory({ id: 'cat-1', userId: 'user-a', name: 'Food' });
    await repo.create(category);

    expect(await repo.listByUser('user-a')).toEqual([category]);

    const renamed = { ...category, name: 'Groceries' };
    await repo.update(renamed);
    expect(await repo.listByUser('user-a')).toEqual([renamed]);

    await repo.delete(category.id);
    expect(await repo.listByUser('user-a')).toEqual([]);
  });

  it('round-trips bulkUpsert', async () => {
    const categories = [
      makeCategory({ id: 'cat-1', userId: 'user-a', name: 'Food' }),
      makeCategory({ id: 'cat-2', userId: 'user-a', name: 'Transport' }),
    ];
    await repo.bulkUpsert(categories);

    const stored = await repo.listByUser('user-a');
    expect(stored).toHaveLength(2);
    expect(stored).toEqual(expect.arrayContaining(categories));
  });

  it('isolates categories between two users', async () => {
    const userACategory = makeCategory({ id: 'cat-a', userId: 'user-a', name: 'Food' });
    const userBCategory = makeCategory({ id: 'cat-b', userId: 'user-b', name: 'Salary' });
    await repo.create(userACategory);
    await repo.create(userBCategory);

    expect(await repo.listByUser('user-a')).toEqual([userACategory]);
    expect(await repo.listByUser('user-b')).toEqual([userBCategory]);
  });

  it('deleting one user categories does not affect another user', async () => {
    const userACategory = makeCategory({ id: 'cat-a', userId: 'user-a', name: 'Food' });
    const userBCategory = makeCategory({ id: 'cat-b', userId: 'user-b', name: 'Salary' });
    await repo.create(userACategory);
    await repo.create(userBCategory);

    await repo.delete(userACategory.id);

    expect(await repo.listByUser('user-a')).toEqual([]);
    expect(await repo.listByUser('user-b')).toEqual([userBCategory]);
  });
});

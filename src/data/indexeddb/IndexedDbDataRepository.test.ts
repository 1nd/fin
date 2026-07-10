import type { Category, Entry } from '@/domain/models';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { createDbProvider } from './db';
import { IndexedDbDataRepository } from './IndexedDbDataRepository';

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

function makeEntry(overrides: Partial<Entry> & Pick<Entry, 'id' | 'userId'>): Entry {
  return {
    categoryId: 'cat-1',
    entityType: 'expense',
    amount: 50000,
    currency: 'IDR',
    fxRateToBase: 1,
    date: '2026-01-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('IndexedDbDataRepository', () => {
  let repo: IndexedDbDataRepository;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    repo = new IndexedDbDataRepository(createDbProvider());
  });

  describe('hasAnyDataForUser', () => {
    it('is false for a user with no data', async () => {
      expect(await repo.hasAnyDataForUser('user-a')).toBe(false);
    });

    it('is true with only categories', async () => {
      await repo.categories.create(makeCategory({ id: 'cat-1', userId: 'user-a' }));
      expect(await repo.hasAnyDataForUser('user-a')).toBe(true);
    });

    it('is true with only entries', async () => {
      await repo.entries.create(makeEntry({ id: 'entry-1', userId: 'user-a' }));
      expect(await repo.hasAnyDataForUser('user-a')).toBe(true);
    });

    it('ignores other users data', async () => {
      await repo.categories.create(makeCategory({ id: 'cat-b', userId: 'user-b' }));
      await repo.entries.create(makeEntry({ id: 'entry-b', userId: 'user-b' }));
      expect(await repo.hasAnyDataForUser('user-a')).toBe(false);
    });
  });

  describe('replaceAllForUser', () => {
    it('replaces the user data wholesale, discarding records absent from the restore', async () => {
      await repo.categories.create(makeCategory({ id: 'cat-old', userId: 'user-a' }));
      await repo.entries.create(makeEntry({ id: 'entry-old', userId: 'user-a' }));

      const restoredCategory = makeCategory({ id: 'cat-new', userId: 'user-a', name: 'Salary' });
      const restoredEntry = makeEntry({ id: 'entry-new', userId: 'user-a', amount: 123 });
      await repo.replaceAllForUser('user-a', {
        categories: [restoredCategory],
        entries: [restoredEntry],
      });

      expect(await repo.categories.listByUser('user-a')).toEqual([restoredCategory]);
      expect(await repo.entries.listByUser('user-a')).toEqual([restoredEntry]);
    });

    it('leaves other users data untouched', async () => {
      const userBCategory = makeCategory({ id: 'cat-b', userId: 'user-b' });
      const userBEntry = makeEntry({ id: 'entry-b', userId: 'user-b' });
      await repo.categories.create(userBCategory);
      await repo.entries.create(userBEntry);
      await repo.categories.create(makeCategory({ id: 'cat-a', userId: 'user-a' }));

      await repo.replaceAllForUser('user-a', {
        categories: [makeCategory({ id: 'cat-a2', userId: 'user-a' })],
        entries: [],
      });

      expect(await repo.categories.listByUser('user-b')).toEqual([userBCategory]);
      expect(await repo.entries.listByUser('user-b')).toEqual([userBEntry]);
    });

    it('works for a user with no prior data (fresh-device restore)', async () => {
      const restoredCategory = makeCategory({ id: 'cat-1', userId: 'user-a' });
      const restoredEntry = makeEntry({ id: 'entry-1', userId: 'user-a' });

      await repo.replaceAllForUser('user-a', {
        categories: [restoredCategory],
        entries: [restoredEntry],
      });

      expect(await repo.categories.listByUser('user-a')).toEqual([restoredCategory]);
      expect(await repo.entries.listByUser('user-a')).toEqual([restoredEntry]);
    });
  });
});

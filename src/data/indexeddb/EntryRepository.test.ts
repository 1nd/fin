import type { Entry } from '@/domain/models';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { createDbProvider } from './db';
import { IndexedDbEntryRepository } from './EntryRepository';

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

describe('IndexedDbEntryRepository', () => {
  let repo: IndexedDbEntryRepository;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    repo = new IndexedDbEntryRepository(createDbProvider());
  });

  it('round-trips create, update, and delete', async () => {
    const entry = makeEntry({ id: 'entry-1', userId: 'user-a', amount: 50000 });
    await repo.create(entry);

    expect(await repo.listByUser('user-a')).toEqual([entry]);

    const edited = { ...entry, amount: 75000 };
    await repo.update(edited);
    expect(await repo.listByUser('user-a')).toEqual([edited]);

    await repo.delete(entry.id);
    expect(await repo.listByUser('user-a')).toEqual([]);
  });

  it('round-trips bulkUpsert', async () => {
    const entries = [
      makeEntry({ id: 'entry-1', userId: 'user-a', amount: 50000 }),
      makeEntry({ id: 'entry-2', userId: 'user-a', amount: 20000 }),
    ];
    await repo.bulkUpsert(entries);

    const stored = await repo.listByUser('user-a');
    expect(stored).toHaveLength(2);
    expect(stored).toEqual(expect.arrayContaining(entries));
  });

  it('isolates entries between two users', async () => {
    const userAEntry = makeEntry({ id: 'entry-a', userId: 'user-a', amount: 50000 });
    const userBEntry = makeEntry({ id: 'entry-b', userId: 'user-b', amount: 999999 });
    await repo.create(userAEntry);
    await repo.create(userBEntry);

    expect(await repo.listByUser('user-a')).toEqual([userAEntry]);
    expect(await repo.listByUser('user-b')).toEqual([userBEntry]);
  });

  it('deleting one user entries does not affect another user', async () => {
    const userAEntry = makeEntry({ id: 'entry-a', userId: 'user-a', amount: 50000 });
    const userBEntry = makeEntry({ id: 'entry-b', userId: 'user-b', amount: 999999 });
    await repo.create(userAEntry);
    await repo.create(userBEntry);

    await repo.delete(userAEntry.id);

    expect(await repo.listByUser('user-a')).toEqual([]);
    expect(await repo.listByUser('user-b')).toEqual([userBEntry]);
  });
});

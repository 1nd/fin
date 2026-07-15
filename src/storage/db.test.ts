import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { deleteDB, openDB } from 'idb';
import { closeDb, getDb } from './db';

describe('getDb', () => {
  beforeEach(async () => {
    await closeDb();
    (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  });

  it('creates the settings store keyed by [userId, key]', async () => {
    const db = await getDb();
    expect([...db.objectStoreNames]).toContain('settings');
    expect(db.transaction('settings').store.keyPath).toEqual(['userId', 'key']);
  });

  it('reuses one connection across calls', async () => {
    const first = getDb();
    const second = getDb();
    expect(first).toBe(second);
  });

  it('retries after a failed open instead of caching the rejection', async () => {
    // Pre-create the database at a higher version so opening at DB_VERSION
    // rejects with a VersionError.
    const blocker = await openDB('fin', 999);
    blocker.close();

    await expect(getDb()).rejects.toThrow();

    // Once the cause is gone, the next call must succeed rather than replay
    // the cached rejection.
    await deleteDB('fin');
    await expect(getDb()).resolves.toBeDefined();
  });
});

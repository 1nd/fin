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

  it('yields its connection so another tab upgrading the schema is not blocked indefinitely', async () => {
    await getDb();

    // Simulates another tab requesting a schema upgrade while this tab's
    // connection (opened via getDb() above) is still open. Without the
    // `blocking` handler closing our connection, this would hang forever.
    const upgraded = await openDB('fin', 2, { upgrade() {} });

    expect(upgraded.version).toBe(2);
    upgraded.close();
  });

  it('does not disturb a connection when another tab opens at the same version', async () => {
    const db = await getDb();

    const sameVersion = await openDB('fin', 1);
    // The original connection was never closed by the same-version peer.
    expect(() => db.transaction('settings')).not.toThrow();

    sameVersion.close();
  });
});

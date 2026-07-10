import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { createDbProvider, shouldClearCache } from './db';

describe('shouldClearCache', () => {
  it('clears when the event is tied to the currently cached value', () => {
    const current = {};
    expect(shouldClearCache(current, current)).toBe(true);
  });

  it('does not clear when the cache is already empty', () => {
    const source = {};
    expect(shouldClearCache(undefined, source)).toBe(false);
  });

  it('does not clear a late event from a connection a newer open already superseded', () => {
    // Simulates: connection A opens, a newer connection B replaces it in the
    // cache, then a late `terminated` event for the now-defunct A arrives.
    // That stale event must not wipe out the still-live B.
    const connectionA = {};
    const connectionB = {};
    expect(shouldClearCache(connectionB, connectionA)).toBe(false);
  });
});

describe('createDbProvider', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('reuses the same connection across calls', async () => {
    const getDb = createDbProvider();

    const first = await getDb();
    const second = await getDb();

    expect(second).toBe(first);
  });

  it('releases its connection when another tab upgrades the schema, then reopens fresh', async () => {
    const getDb = createDbProvider();
    await getDb();

    // Another tab opening a newer schema version fires `versionchange` on our
    // connection; the provider's `blocking` handler must close it, or this
    // open would hang forever (and time the test out).
    (await openDB('fin', 2)).close();

    // The provider dropped the dead connection: the next call performs a
    // fresh open attempt, which correctly reports the version conflict
    // instead of handing back the closed connection.
    await expect(getDb()).rejects.toThrow();
  });

  it('retries after a failed open instead of caching the rejection', async () => {
    // Force a VersionError: the 'fin' DB already exists at a higher version
    // than the provider requests.
    (await openDB('fin', 2)).close();

    const getDb = createDbProvider();
    await expect(getDb()).rejects.toThrow();

    // The environment recovers (fresh browser state); the same provider
    // must be able to open the database now.
    globalThis.indexedDB = new IDBFactory();
    const db = await getDb();

    expect(db.name).toBe('fin');
    expect([...db.objectStoreNames].sort()).toEqual(['categories', 'entries', 'settings']);
  });
});

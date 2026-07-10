// CCA: 3
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Category, Entry, UserSettings } from '@/domain/models';

interface FinDB extends DBSchema {
  categories: {
    key: string;
    value: Category;
    indexes: { userId: string };
  };
  entries: {
    key: string;
    value: Entry;
    indexes: { userId: string };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
}

const DB_NAME = 'fin';
const DB_VERSION = 1;

export type GetDb = () => Promise<IDBPDatabase<FinDB>>;

/**
 * A cached value should only be dropped by an event tied to the promise
 * currently occupying the cache — never by a late event from a promise a
 * newer open has already superseded (e.g. a `terminated` callback for a
 * connection that was already replaced).
 */
export function shouldClearCache<T>(cached: T | undefined, source: T): boolean {
  return cached === source;
}

/**
 * Returns a function that opens the database on first call and reuses the
 * connection afterwards. Failure states are never cached: a failed open is
 * retried on the next call (so a transient failure — blocked upgrade,
 * private-mode restriction — doesn't poison the rest of the session), and a
 * connection lost mid-session (abnormal termination, or closed to let another
 * tab upgrade the schema) is replaced by a fresh open on the next call.
 */
export function createDbProvider(): GetDb {
  let dbPromise: Promise<IDBPDatabase<FinDB>> | undefined;

  return () => {
    if (!dbPromise) {
      const promise = openDB<FinDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          const categories = db.createObjectStore('categories', { keyPath: 'id' });
          categories.createIndex('userId', 'userId');

          const entries = db.createObjectStore('entries', { keyPath: 'id' });
          entries.createIndex('userId', 'userId');

          db.createObjectStore('settings', { keyPath: 'userId' });
        },
        blocking() {
          // Another tab is upgrading to a newer schema version. Release the
          // connection so its upgrade can proceed instead of hanging it; the
          // next operation here reopens (and surfaces a version error if this
          // tab's code is now outdated).
          if (shouldClearCache(dbPromise, promise)) {
            dbPromise = undefined;
          }
          promise.then((db) => db.close());
        },
        terminated() {
          // The browser closed the connection abnormally; reopen on next use.
          if (shouldClearCache(dbPromise, promise)) {
            dbPromise = undefined;
          }
        },
      });
      promise.catch(() => {
        if (shouldClearCache(dbPromise, promise)) {
          dbPromise = undefined;
        }
      });
      dbPromise = promise;
    }
    return dbPromise;
  };
}

export type { FinDB };

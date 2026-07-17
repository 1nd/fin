// CCA: 4
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'fin';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | undefined;

export function getDb(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: ['userId', 'key'] });
      }
    },
    blocked(currentVersion, blockedVersion) {
      console.warn(
        `IndexedDB open blocked by an older connection (v${currentVersion} blocking v${blockedVersion})`,
      );
    },
    blocking() {
      // Another tab is upgrading to a newer version; this connection would
      // otherwise block it indefinitely. Yield it: close and drop the cache
      // so this tab's next getDb() reopens fresh, at the new version.
      void closeDb();
    },
    terminated() {
      console.warn('IndexedDB connection was abnormally terminated');
      dbPromise = undefined;
    },
  }).catch((error: unknown) => {
    // A failed open must not be cached: the next call retries instead of
    // replaying the rejection until reload.
    dbPromise = undefined;
    throw error;
  });
  return dbPromise;
}

// Closes the shared connection and clears the cache so the next getDb() opens
// fresh. Tests use this to give each case an isolated database.
export async function closeDb(): Promise<void> {
  const promise = dbPromise;
  dbPromise = undefined;
  if (!promise) return;
  try {
    (await promise).close();
  } catch {
    // The open failed; there is no connection to close.
  }
}

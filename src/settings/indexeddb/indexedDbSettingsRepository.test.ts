import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { closeDb, getDb } from '../../storage/db';
import type { SettingsRecord } from '../settingsRepository';
import { IndexedDbSettingsRepository } from './indexedDbSettingsRepository';

describe('IndexedDbSettingsRepository', () => {
  const repo = new IndexedDbSettingsRepository();

  beforeEach(async () => {
    await closeDb();
    (globalThis as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
  });

  it('returns undefined for a key that was never set', async () => {
    await expect(repo.get('user-1', 'language')).resolves.toBeUndefined();
  });

  it('persists and retrieves a value scoped by userId and key', async () => {
    await repo.set('user-1', 'language', 'id');
    const record = await repo.get('user-1', 'language');
    expect(record?.value).toBe('id');
    expect(record?.userId).toBe('user-1');
  });

  it('keeps values for different users independent', async () => {
    await repo.set('user-a', 'language', 'id');
    await expect(repo.get('user-b', 'language')).resolves.toBeUndefined();
  });

  it('tombstones a removed value so it is no longer returned', async () => {
    await repo.set('user-1', 'language', 'id');
    await repo.remove('user-1', 'language');
    await expect(repo.get('user-1', 'language')).resolves.toBeUndefined();
  });

  it('revives a removed key when set again', async () => {
    await repo.set('user-1', 'language', 'id');
    await repo.remove('user-1', 'language');
    await repo.set('user-1', 'language', 'en');
    const record = await repo.get('user-1', 'language');
    expect(record?.value).toBe('en');
    expect(record?.deletedAt).toBeUndefined();
  });

  it('does not resurrect a stale value when a write races the remove', async () => {
    await repo.set('user-1', 'language', 'id');

    // A concurrent write lands while remove is mid-flight. Because remove's
    // read and tombstone-write share one transaction, remove sees the fresh
    // 'en' value rather than re-committing the stale 'id' it would otherwise
    // have read first.
    await Promise.all([repo.remove('user-1', 'language'), repo.set('user-1', 'language', 'en')]);

    const db = await getDb();
    const raw = (await db.get('settings', ['user-1', 'language'])) as SettingsRecord;
    expect(raw.value).toBe('en');
  });
});

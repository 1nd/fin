// CCA: 4
import { getDb } from '../../storage/db';
import type { SettingsRecord, SettingsRepository } from '../settingsRepository';

export class IndexedDbSettingsRepository implements SettingsRepository {
  async get(userId: string, key: string): Promise<SettingsRecord | undefined> {
    const db = await getDb();
    const record = (await db.get('settings', [userId, key])) as SettingsRecord | undefined;
    return record?.deletedAt ? undefined : record;
  }

  async set(userId: string, key: string, value: string): Promise<void> {
    const db = await getDb();
    const record: SettingsRecord = {
      id: `${userId}:${key}`,
      userId,
      key,
      value,
      updatedAt: new Date().toISOString(),
    };
    await db.put('settings', record);
  }

  async remove(userId: string, key: string): Promise<void> {
    const db = await getDb();
    // Read and tombstone-write share one transaction so the read-modify-write is
    // atomic: a concurrent writer (another tab now, another device via sync
    // later) can't commit between them and have this blind put resurrect the
    // stale value we read.
    const tx = db.transaction('settings', 'readwrite');
    const existing = (await tx.store.get([userId, key])) as SettingsRecord | undefined;
    if (existing) {
      await tx.store.put({ ...existing, deletedAt: new Date().toISOString() });
    }
    await tx.done;
  }
}

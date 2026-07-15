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
    const existing = (await db.get('settings', [userId, key])) as SettingsRecord | undefined;
    if (!existing) return;
    await db.put('settings', { ...existing, deletedAt: new Date().toISOString() });
  }
}

// CCA: 3
import type { UserSettings } from '@/domain/models';
import type { SettingsRepository } from '../repository-ports';
import type { GetDb } from './db';

export class IndexedDbSettingsRepository implements SettingsRepository {
  constructor(private readonly getDb: GetDb) {}

  async get(userId: string): Promise<UserSettings | undefined> {
    const db = await this.getDb();
    return db.get('settings', userId);
  }

  async put(settings: UserSettings): Promise<void> {
    const db = await this.getDb();
    await db.put('settings', settings);
  }
}

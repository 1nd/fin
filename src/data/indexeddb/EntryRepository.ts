// CCA: 3
import type { Entry } from '@/domain/models';
import type { EntryRepository } from '../repository-ports';
import type { GetDb } from './db';

export class IndexedDbEntryRepository implements EntryRepository {
  constructor(private readonly getDb: GetDb) {}

  async listByUser(userId: string): Promise<Entry[]> {
    const db = await this.getDb();
    return db.getAllFromIndex('entries', 'userId', userId);
  }

  async create(entry: Entry): Promise<void> {
    const db = await this.getDb();
    await db.put('entries', entry);
  }

  async update(entry: Entry): Promise<void> {
    const db = await this.getDb();
    await db.put('entries', entry);
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('entries', id);
  }

  async bulkUpsert(entries: Entry[]): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('entries', 'readwrite');
    await Promise.all([...entries.map((e) => tx.store.put(e)), tx.done]);
  }
}

// CCA: 3
import type { Category, Entry } from '@/domain/models';
import type { DataRepository } from '../repository-ports';
import { IndexedDbCategoryRepository } from './CategoryRepository';
import { createDbProvider, type GetDb } from './db';
import { IndexedDbEntryRepository } from './EntryRepository';
import { IndexedDbSettingsRepository } from './SettingsRepository';

export class IndexedDbDataRepository implements DataRepository {
  readonly categories: IndexedDbCategoryRepository;
  readonly entries: IndexedDbEntryRepository;
  readonly settings: IndexedDbSettingsRepository;

  constructor(private readonly getDb: GetDb = createDbProvider()) {
    this.categories = new IndexedDbCategoryRepository(getDb);
    this.entries = new IndexedDbEntryRepository(getDb);
    this.settings = new IndexedDbSettingsRepository(getDb);
  }

  async hasAnyDataForUser(userId: string): Promise<boolean> {
    const [categories, entries] = await Promise.all([
      this.categories.listByUser(userId),
      this.entries.listByUser(userId),
    ]);
    return categories.length > 0 || entries.length > 0;
  }

  /** Full replace (Decision 9 restore semantics): discards existing data for this user. */
  async replaceAllForUser(
    userId: string,
    data: { categories: Category[]; entries: Entry[] },
  ): Promise<void> {
    const db = await this.getDb();
    const [existingCategories, existingEntries] = await Promise.all([
      this.categories.listByUser(userId),
      this.entries.listByUser(userId),
    ]);

    const tx = db.transaction(['categories', 'entries'], 'readwrite');
    await Promise.all([
      ...existingCategories.map((c) => tx.objectStore('categories').delete(c.id)),
      ...existingEntries.map((e) => tx.objectStore('entries').delete(e.id)),
      ...data.categories.map((c) => tx.objectStore('categories').put(c)),
      ...data.entries.map((e) => tx.objectStore('entries').put(e)),
      tx.done,
    ]);
  }
}

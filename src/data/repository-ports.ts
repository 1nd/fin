// CCA: 2
import type { Category, Entry, UserSettings } from '@/domain/models';

export interface CategoryRepository {
  listByUser(userId: string): Promise<Category[]>;
  create(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
  delete(id: string): Promise<void>;
  bulkUpsert(categories: Category[]): Promise<void>;
}

export interface EntryRepository {
  listByUser(userId: string): Promise<Entry[]>;
  create(entry: Entry): Promise<void>;
  update(entry: Entry): Promise<void>;
  delete(id: string): Promise<void>;
  bulkUpsert(entries: Entry[]): Promise<void>;
}

export interface SettingsRepository {
  get(userId: string): Promise<UserSettings | undefined>;
  put(settings: UserSettings): Promise<void>;
}

/**
 * Aggregates the individual repositories plus cross-cutting operations
 * (full replace for restore, presence check for the sign-in empty-state
 * check) that need to touch more than one store.
 */
export interface StorageRepository {
  categories: CategoryRepository;
  entries: EntryRepository;
  settings: SettingsRepository;
  hasAnyDataForUser(userId: string): Promise<boolean>;
  replaceAllForUser(
    userId: string,
    data: { categories: Category[]; entries: Entry[] },
  ): Promise<void>;
}

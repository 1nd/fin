// CCA: 3
import type { Category } from '@/domain/models';
import type { CategoryRepository } from '../repository-ports';
import type { GetDb } from './db';

export class IndexedDbCategoryRepository implements CategoryRepository {
  constructor(private readonly getDb: GetDb) {}

  async listByUser(userId: string): Promise<Category[]> {
    const db = await this.getDb();
    return db.getAllFromIndex('categories', 'userId', userId);
  }

  async create(category: Category): Promise<void> {
    const db = await this.getDb();
    await db.put('categories', category);
  }

  async update(category: Category): Promise<void> {
    const db = await this.getDb();
    await db.put('categories', category);
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete('categories', id);
  }

  async bulkUpsert(categories: Category[]): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('categories', 'readwrite');
    await Promise.all([...categories.map((c) => tx.store.put(c)), tx.done]);
  }
}

import { describe, expect, it } from 'vitest';
import type { SettingsRecord, SettingsRepository } from './settingsRepository';
import { SettingsUseCase } from './settingsUseCase';

class InMemorySettingsRepository implements SettingsRepository {
  private readonly records = new Map<string, SettingsRecord>();

  async get(userId: string, key: string): Promise<SettingsRecord | undefined> {
    const record = this.records.get(`${userId}:${key}`);
    return record?.deletedAt ? undefined : record;
  }

  async set(userId: string, key: string, value: string): Promise<void> {
    this.records.set(`${userId}:${key}`, {
      id: `${userId}:${key}`,
      userId,
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }

  async remove(userId: string, key: string): Promise<void> {
    const existing = this.records.get(`${userId}:${key}`);
    if (!existing) return;
    this.records.set(`${userId}:${key}`, { ...existing, deletedAt: new Date().toISOString() });
  }
}

describe('SettingsUseCase', () => {
  it('computes effective preferences from the cascade when there are no overrides', async () => {
    const useCase = new SettingsUseCase(new InMemorySettingsRepository(), 'user-1');
    const prefs = await useCase.getEffectivePreferences(null, 'id-ID');
    expect(prefs.language).toBe('id');
  });

  it('loads a stored override and applies it over the cascade', async () => {
    const repository = new InMemorySettingsRepository();
    const useCase = new SettingsUseCase(repository, 'user-1');
    await useCase.setOverride('language', 'en');

    const prefs = await useCase.getEffectivePreferences(null, 'id-ID');
    expect(prefs.language).toBe('en');
    // Untouched preferences remain cascade-derived.
    expect(prefs.numberFormat).toBe('comma-decimal');
  });

  it('keeps overrides partitioned per user', async () => {
    const repository = new InMemorySettingsRepository();
    const useCaseA = new SettingsUseCase(repository, 'user-a');
    const useCaseB = new SettingsUseCase(repository, 'user-b');
    await useCaseA.setOverride('language', 'id');

    const prefsA = await useCaseA.getEffectivePreferences(null, null);
    const prefsB = await useCaseB.getEffectivePreferences(null, null);
    expect(prefsA.language).toBe('id');
    expect(prefsB.language).toBe('en');
  });
});

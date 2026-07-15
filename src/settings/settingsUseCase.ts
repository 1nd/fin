// CCA: 2
import { PREFERENCE_KEYS, type PreferenceKey, type Preferences } from './preferences';
import { resolvePreferences, type PreferenceOverrides } from './resolvePreferences';
import type { SettingsRepository } from './settingsRepository';

export class SettingsUseCase {
  private readonly repository: SettingsRepository;
  private readonly userId: string;

  constructor(repository: SettingsRepository, userId: string) {
    this.repository = repository;
    this.userId = userId;
  }

  async getEffectivePreferences(
    accountLocale: string | null,
    browserLocale: string | null,
  ): Promise<Preferences> {
    const overrides = await this.loadOverrides();
    return resolvePreferences(accountLocale, browserLocale, overrides);
  }

  async setOverride<K extends PreferenceKey>(key: K, value: Preferences[K]): Promise<void> {
    await this.repository.set(this.userId, key, value);
  }

  private async loadOverrides(): Promise<PreferenceOverrides> {
    const overrides: PreferenceOverrides = {};
    for (const key of PREFERENCE_KEYS) {
      const record = await this.repository.get(this.userId, key);
      if (record) overrides[key] = record.value;
    }
    return overrides;
  }
}

// CCA: 2
import type { StorageRecord } from '../storage/record';

export type SettingsRecord = StorageRecord<{
  key: string;
  value: string;
}>;

export interface SettingsRepository {
  get(userId: string, key: string): Promise<SettingsRecord | undefined>;
  set(userId: string, key: string, value: string): Promise<void>;
  remove(userId: string, key: string): Promise<void>;
}

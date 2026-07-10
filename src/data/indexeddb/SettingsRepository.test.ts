import type { UserSettings } from '@/domain/models';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { createDbProvider } from './db';
import { IndexedDbSettingsRepository } from './SettingsRepository';

function makeSettings(
  overrides: Partial<UserSettings> & Pick<UserSettings, 'userId'>,
): UserSettings {
  return {
    baseCurrency: null,
    language: 'en',
    numberFormat: 'id-ID',
    dateFormat: 'YYYY-MM-DD',
    lastBackupAt: null,
    lastBackupStatus: null,
    lastBackupPendingChanges: false,
    ...overrides,
  };
}

describe('IndexedDbSettingsRepository', () => {
  let repo: IndexedDbSettingsRepository;

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    repo = new IndexedDbSettingsRepository(createDbProvider());
  });

  it('returns undefined for a user with no settings', async () => {
    expect(await repo.get('user-a')).toBeUndefined();
  });

  it('round-trips put and get', async () => {
    const settings = makeSettings({ userId: 'user-a', language: 'id' });
    await repo.put(settings);

    expect(await repo.get('user-a')).toEqual(settings);
  });

  it('overwrites existing settings for the same user', async () => {
    await repo.put(makeSettings({ userId: 'user-a', baseCurrency: null }));
    const updated = makeSettings({ userId: 'user-a', baseCurrency: 'IDR' });
    await repo.put(updated);

    expect(await repo.get('user-a')).toEqual(updated);
  });

  it('keeps settings separate per user', async () => {
    const userASettings = makeSettings({ userId: 'user-a', language: 'en' });
    const userBSettings = makeSettings({ userId: 'user-b', language: 'id' });
    await repo.put(userASettings);
    await repo.put(userBSettings);

    expect(await repo.get('user-a')).toEqual(userASettings);
    expect(await repo.get('user-b')).toEqual(userBSettings);
  });
});

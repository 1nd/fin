import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserIdentity } from '../userIdentity';
import { LocalStorageSessionStore, SESSION_STORAGE_KEY } from './localStorageSessionStore';

const ALICE: UserIdentity = {
  userId: 'google-sub-alice',
  displayName: 'Alice',
  email: 'alice@example.com',
  pictureUrl: 'https://example.com/alice.jpg',
  locale: 'en',
};

describe('LocalStorageSessionStore', () => {
  afterEach(() => {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it('restores nothing when no session has been persisted', () => {
    const store = new LocalStorageSessionStore();
    expect(store.restore()).toBeNull();
  });

  it('round-trips a persisted identity through the well-known key', () => {
    const store = new LocalStorageSessionStore();

    store.persist(ALICE);

    expect(store.restore()).toEqual(ALICE);
    expect(JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) ?? '')).toEqual(ALICE);
  });

  it('overwrites a previously persisted identity rather than merging it', () => {
    const store = new LocalStorageSessionStore();
    const bob: UserIdentity = {
      userId: 'google-sub-bob',
      displayName: 'Bob',
      email: 'bob@example.com',
    };

    store.persist(ALICE);
    store.persist(bob);

    expect(store.restore()).toEqual(bob);
  });

  it('clears the persisted session so a later restore finds nothing', () => {
    const store = new LocalStorageSessionStore();
    store.persist(ALICE);

    store.clear();

    expect(store.restore()).toBeNull();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('treats a corrupted stored value as no session instead of throwing', () => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, 'not-json{');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = new LocalStorageSessionStore();

    expect(store.restore()).toBeNull();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  // A partial/corrupt write is still valid JSON, so it must be rejected by shape, not just
  // by the JSON.parse try/catch above — otherwise it's accepted as a truthy "identity" with
  // `userId: undefined`, which silently breaks per-user storage keying downstream.
  it.each([
    ['an empty object', {}],
    ['an empty userId', { userId: '', displayName: 'Alice', email: 'alice@example.com' }],
    ['a missing displayName', { userId: 'google-sub-alice', email: 'alice@example.com' }],
    ['a missing email', { userId: 'google-sub-alice', displayName: 'Alice' }],
    ['a non-object', 'google-sub-alice'],
  ])('treats a stored value with %s as no session', (_description, storedValue) => {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(storedValue));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = new LocalStorageSessionStore();

    expect(store.restore()).toBeNull();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});

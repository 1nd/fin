import type { AuthUser } from '../auth-types';
import { webSessionStorage } from './web-session-storage';

class FakeLocalStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return { userId: 'user-a', email: 'a@example.com', name: 'A', locale: 'en-US', ...overrides };
}

describe('webSessionStorage', () => {
  beforeEach(() => {
    globalThis.localStorage = new FakeLocalStorage();
  });

  it('returns null when nothing has been saved', () => {
    expect(webSessionStorage.load()).toBeNull();
  });

  it('round-trips a saved user', () => {
    const user = makeUser();
    webSessionStorage.save(user);
    expect(webSessionStorage.load()).toEqual(user);
  });

  it('returns null after clear', () => {
    webSessionStorage.save(makeUser());
    webSessionStorage.clear();
    expect(webSessionStorage.load()).toBeNull();
  });

  it('ignores malformed stored data rather than throwing', () => {
    localStorage.setItem('fin.session.user', '{not json');
    expect(webSessionStorage.load()).toBeNull();
  });

  it('ignores stored data that is not a recognizable AuthUser', () => {
    localStorage.setItem('fin.session.user', JSON.stringify({ foo: 'bar' }));
    expect(webSessionStorage.load()).toBeNull();
  });
});

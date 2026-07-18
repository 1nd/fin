// CCA: 4
import type { SessionStore } from './sessionStorePorts';
import type { UserIdentity } from '../userIdentity';

// A single well-known key, not the per-user IndexedDB stores: the session is
// the pointer to who the user is, needed before any userId exists (`google-signin` D4).
export const SESSION_STORAGE_KEY = 'fin.identity.session';

export class LocalStorageSessionStore implements SessionStore {
  restore(): UserIdentity | null {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserIdentity;
    } catch (error) {
      console.warn('Failed to parse stored identity session', error);
      return null;
    }
  }

  persist(identity: UserIdentity): void {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(identity));
  }

  clear(): void {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

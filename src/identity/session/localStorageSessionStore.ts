// CCA: 4
import type { SessionStore } from './sessionStorePorts';
import type { UserIdentity } from '../userIdentity';

// A single well-known key, not the per-user IndexedDB stores: the session is
// the pointer to who the user is, needed before any userId exists (`google-signin` D4).
export const SESSION_STORAGE_KEY = 'fin.identity.session';

// A stored value missing `userId` is truthy but breaks per-user storage keying (an empty
// object resolves to `userId: undefined`, which callers treat as no partition rather than
// as a rejected session); guard against a partial/corrupt write the same way a malformed
// one is already guarded against, not just against unparseable JSON.
function isValidUserIdentity(value: unknown): value is UserIdentity {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<UserIdentity>;
  return (
    typeof candidate.userId === 'string' &&
    candidate.userId.length > 0 &&
    typeof candidate.displayName === 'string' &&
    typeof candidate.email === 'string'
  );
}

export class LocalStorageSessionStore implements SessionStore {
  restore(): UserIdentity | null {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isValidUserIdentity(parsed)) {
        console.warn('Stored identity session has an unexpected shape');
        return null;
      }
      return parsed;
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

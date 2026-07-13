// CCA: 3
import type { AuthUser } from '../auth-types';
import type { SessionStorage } from './session-storage-port';

const STORAGE_KEY = 'fin.session.user';

function isAuthUser(value: unknown): value is AuthUser {
  return !!value && typeof value === 'object' && typeof (value as AuthUser).userId === 'string';
}

/** `localStorage`-backed session persistence -- Phase 1 targets web only (design Decision 2). */
export const webSessionStorage: SessionStorage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isAuthUser(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  save(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};

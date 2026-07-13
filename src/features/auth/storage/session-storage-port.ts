// CCA: 2
import type { AuthUser } from '../auth-types';

/**
 * Persists only the derived identity (not OAuth tokens) so the app can restore a signed-in
 * session on reload without a fresh Google prompt. Phase 1 sessions are an access convenience,
 * not a security boundary (design Decision 6) — nothing here is meant to resist tampering.
 */
export interface SessionStorage {
  load(): AuthUser | null;
  save(user: AuthUser): void;
  clear(): void;
}

// CCA: 2
// A port that contains contract for the Identity's session store

import type { UserIdentity } from '../userIdentity';

export interface SessionStore {
  restore(): UserIdentity | null;
  persist(identity: UserIdentity): void;
  clear(): void;
}

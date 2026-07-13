// CCA: 2
import { createContext, useContext } from 'react';
import type { AuthState } from './auth-types';

export type AuthContextValue = AuthState & {
  /** Whether the sign-in request has finished loading and `signIn` can be called. */
  canSignIn: boolean;
  signIn(): Promise<void>;
  signOut(): void;
};

/**
 * Populated by `AuthProvider` (Clean Code Architecture Layer 4). Other features read the current `userId` through this
 * hook — never through Google APIs directly (design Decision 10: Ledger never imports auth).
 */
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return value;
}

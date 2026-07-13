// CCA: 2
import type { AuthState, AuthUser } from './auth-types';

export type SignInResultType = 'success' | 'error' | 'cancel' | 'dismiss' | 'locked' | 'opened';

export interface SignInResult {
  type: SignInResultType;
  accessToken?: string;
  errorMessage?: string;
}

export type ProfileFetchOutcome = { user: AuthUser } | { error: Error };

/**
 * Maps a completed Google sign-in attempt to a next `AuthState`, or to `'fetch-profile'` when the
 * caller must still exchange the access token for the account's profile before a final state is
 * known. Kept pure and separate from `AuthProvider` so the sign-in/failure/cancel branches (auth
 * spec scenarios) are unit-testable without rendering (design Decision 10/11).
 */
export function stateAfterSignInResult(result: SignInResult): AuthState | 'fetch-profile' {
  if (result.type === 'success') {
    return result.accessToken
      ? 'fetch-profile'
      : { status: 'signed-out', error: 'Sign-in did not return an access token.' };
  }
  if (result.type === 'error') {
    return { status: 'signed-out', error: result.errorMessage ?? 'Sign-in failed.' };
  }
  // 'cancel' | 'dismiss' | 'locked' | 'opened': no completed attempt to report yet.
  return { status: 'signed-out', error: null };
}

export function stateAfterProfileFetch(outcome: ProfileFetchOutcome): AuthState {
  return 'user' in outcome
    ? { status: 'signed-in', user: outcome.user }
    : { status: 'signed-out', error: outcome.error.message };
}

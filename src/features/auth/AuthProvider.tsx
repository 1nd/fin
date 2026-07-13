// CCA: 4
import type { AuthSessionResult } from 'expo-auth-session';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext, type AuthContextValue } from './auth-context';
import { stateAfterProfileFetch, stateAfterSignInResult, type SignInResult } from './auth-state';
import type { AuthState } from './auth-types';
import { useGoogleAuthRequest } from './google/google-oauth';
import { fetchGoogleProfile } from './google/google-profile';
import type { SessionStorage } from './storage/session-storage-port';
import { webSessionStorage } from './storage/web-session-storage';

function toSignInResult(response: AuthSessionResult): SignInResult {
  return {
    type: response.type,
    accessToken: response.type === 'success' ? response.authentication?.accessToken : undefined,
    errorMessage: response.type === 'error' ? (response.error?.message ?? undefined) : undefined,
  };
}

export function AuthProvider({
  clientId,
  storage = webSessionStorage,
  children,
}: {
  clientId: string;
  storage?: SessionStorage;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AuthState>(() => {
    const restored = storage.load();
    return restored
      ? { status: 'signed-in', user: restored }
      : { status: 'signed-out', error: null };
  });

  const [request, response, promptAsync] = useGoogleAuthRequest(clientId);

  // Tracks the most recent `response` already turned into a state transition, so a completed
  // sign-in attempt is applied exactly once -- synchronously below for outcomes that need no
  // further work, and via the profile-fetch effect further down for the one that does.
  const [handledResponse, setHandledResponse] = useState<AuthSessionResult | null>(null);

  if (response && response !== handledResponse) {
    setHandledResponse(response);
    const next = stateAfterSignInResult(toSignInResult(response));
    if (next !== 'fetch-profile') {
      setState(next);
    }
  }

  useEffect(() => {
    if (!response || response !== handledResponse) return;
    const signInResult = toSignInResult(response);
    const next = stateAfterSignInResult(signInResult);
    if (next !== 'fetch-profile') return; // already applied synchronously above

    fetchGoogleProfile(signInResult.accessToken as string)
      .then((user) => {
        storage.save(user);
        setState(stateAfterProfileFetch({ user }));
      })
      .catch((error: Error) => {
        setState(stateAfterProfileFetch({ error }));
      });
  }, [response, handledResponse, storage]);

  const signIn = useCallback(async () => {
    if (!request) return;
    await promptAsync();
  }, [request, promptAsync]);

  const signOut = useCallback(() => {
    storage.clear();
    setState({ status: 'signed-out', error: null });
  }, [storage]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, canSignIn: request !== null, signIn, signOut }),
    [state, request, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

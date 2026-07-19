// CCA: 4
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ConfigurationError } from './google/errors';
import { GoogleIdentityProvider } from './google/googleIdentityProvider';
import { IdentityUseCase } from './identityUseCase';
import { LocalStorageSessionStore } from './session/localStorageSessionStore';
import type { UserIdentity } from './userIdentity';

export type SignInErrorKind = 'config' | 'signin';

interface IdentityContextValue {
  identity: UserIdentity | null;
  signInError: SignInErrorKind | null;
  // Resolves `true` once the sign-in affordance actually rendered into `container`, `false`
  // if it failed first (script/config) — callers use this to tell "the button is there and
  // can be retried by clicking it" from "there is no button, retrying means calling this
  // again" (a script-load failure must leave an affordance to retry).
  signIn: (container: HTMLElement) => Promise<boolean>;
  signOut: () => void;
}

const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

interface IdentityProviderProps {
  children: ReactNode;
  // Test-only seam: production always uses the real Google Identity Services provider + localStorage
  // session store; tests inject a mock IdentityUseCase (`google-signin` D2).
  useCase?: IdentityUseCase;
}

export function IdentityContextProvider({ children, useCase }: IdentityProviderProps) {
  const resolvedUseCase = useMemo(
    () =>
      useCase ?? new IdentityUseCase(new GoogleIdentityProvider(), new LocalStorageSessionStore()),
    [useCase],
  );
  const [identity, setIdentity] = useState<UserIdentity | null>(() => resolvedUseCase.restore());
  const [signInError, setSignInError] = useState<SignInErrorKind | null>(null);

  // One subscription for the useCase's lifetime, not one per `signIn` call: the rendered
  // affordance can deliver an unbounded number of attempts (every click), and each must
  // reach this state regardless of which `signIn` call rendered it (retry-after-failure
  // regression, `google-signin` review). Layout effect, not a passive one: it must be
  // subscribed before SignInPage's (child) mount effect can call `signIn` — all layout
  // effects finish before any passive effect runs, so this ordering is guaranteed
  // regardless of the provider/child tree shape.
  useLayoutEffect(() => {
    return resolvedUseCase.onIdentity((result) => {
      if (result.ok) {
        setSignInError(null);
        setIdentity(result.identity);
      } else {
        setSignInError(result.error instanceof ConfigurationError ? 'config' : 'signin');
      }
    });
  }, [resolvedUseCase]);

  // Kept stable across identity/signInError changes (they only call stable state
  // setters) so the context value memo below stays effective. Stability is a
  // perf hint only — consumers must not rely on it for correctness (SignInPage
  // guards its mount effect with a ref).
  const signIn = useCallback(
    async (container: HTMLElement) => {
      setSignInError(null);
      try {
        await resolvedUseCase.renderInto(container);
        return true;
      } catch (error) {
        setSignInError(error instanceof ConfigurationError ? 'config' : 'signin');
        return false;
      }
    },
    [resolvedUseCase],
  );

  const signOut = useCallback(() => {
    resolvedUseCase.signOut();
    setIdentity(null);
  }, [resolvedUseCase]);

  const value = useMemo<IdentityContextValue>(
    () => ({ identity, signInError, signIn, signOut }),
    [identity, signInError, signIn, signOut],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  const context = useContext(IdentityContext);
  if (!context) throw new Error('useIdentity must be used within IdentityContextProvider');
  return context;
}

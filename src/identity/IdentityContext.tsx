// CCA: 4
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
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
  signIn: (container: HTMLElement) => Promise<void>;
  signOut: () => void;
}

const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

interface IdentityProviderProps {
  children: ReactNode;
  // Test-only seam: production always uses the real Google Identity Services provider + localStorage
  // session store; tests inject a mock IdentityUseCase (D2).
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

  // Kept stable across identity/signInError changes (they only call stable state
  // setters) so the context value memo below stays effective. Stability is a
  // perf hint only — consumers must not rely on it for correctness (SignInPage
  // guards its mount effect with a ref).
  const signIn = useCallback(
    async (container: HTMLElement) => {
      setSignInError(null);
      try {
        const next = await resolvedUseCase.signIn(container);
        setIdentity(next);
      } catch (error) {
        setSignInError(error instanceof ConfigurationError ? 'config' : 'signin');
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

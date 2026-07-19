// CCA: 2
import type { IdentityProvider, IdentitySignInResult } from './identityProviderPorts';
import type { SessionStore } from './session/sessionStorePorts';
import type { UserIdentity } from './userIdentity';

export class IdentityUseCase {
  private readonly provider: IdentityProvider;
  private readonly sessionStore: SessionStore;
  private readonly listeners = new Set<(result: IdentitySignInResult) => void>();
  private providerSubscription: (() => void) | undefined;

  constructor(provider: IdentityProvider, sessionStore: SessionStore) {
    this.provider = provider;
    this.sessionStore = sessionStore;
  }

  restore(): UserIdentity | null {
    return this.sessionStore.restore();
  }

  renderInto(container: HTMLElement): Promise<void> {
    return this.provider.renderInto(container);
  }

  // Every attempt the rendered affordance delivers (one per click, unbounded) flows through
  // here; a successful one is persisted before subscribers are notified. Persistence happens
  // on a single internal subscription to the provider, not per external listener — otherwise
  // a second subscriber would persist the same identity again.
  onIdentity(listener: (result: IdentitySignInResult) => void): () => void {
    this.listeners.add(listener);
    this.providerSubscription ??= this.provider.onIdentity((result) => {
      if (result.ok) {
        // Persistence failure (quota, private-mode) shouldn't demote a real sign-in to a
        // failure notice; the in-memory session still works, only reload-persistence is lost.
        try {
          this.sessionStore.persist(result.identity);
        } catch (error) {
          console.warn(
            'Failed to persist identity session; sign-in will not survive a reload',
            error,
          );
        }
      }
      for (const eachListener of this.listeners) eachListener(result);
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  signOut(): void {
    this.sessionStore.clear();
  }
}

// CCA: 2
import type { IdentityProvider, IdentitySignInResult } from './identityProviderPorts';
import type { SessionStore } from './session/sessionStorePorts';
import type { UserIdentity } from './userIdentity';

export class IdentityUseCase {
  private readonly provider: IdentityProvider;
  private readonly sessionStore: SessionStore;

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
  // here; a successful one is persisted before the caller is notified.
  onIdentity(listener: (result: IdentitySignInResult) => void): () => void {
    return this.provider.onIdentity((result) => {
      if (result.ok) this.sessionStore.persist(result.identity);
      listener(result);
    });
  }

  signOut(): void {
    this.sessionStore.clear();
  }
}

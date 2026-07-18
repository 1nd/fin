// CCA: 2
import type { IdentityProvider } from './identityProviderPorts';
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

  async signIn(container: HTMLElement): Promise<UserIdentity> {
    const identity = await this.provider.signIn(container);
    this.sessionStore.persist(identity);
    return identity;
  }

  signOut(): void {
    this.sessionStore.clear();
  }
}

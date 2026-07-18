import { IdentityUseCase } from '../identityUseCase';
import type { IdentityProvider } from '../identityProviderPorts';
import type { SessionStore } from '../session/sessionStorePorts';
import type { UserIdentity } from '../userIdentity';

export class InMemorySessionStore implements SessionStore {
  private identity: UserIdentity | null;

  constructor(identity: UserIdentity | null = null) {
    this.identity = identity;
  }

  restore(): UserIdentity | null {
    return this.identity;
  }

  persist(identity: UserIdentity): void {
    this.identity = identity;
  }

  clear(): void {
    this.identity = null;
  }
}

// Never resolves: freezes a rendered gate at the signed-out state.
export class PendingIdentityProvider implements IdentityProvider {
  signIn(): Promise<UserIdentity> {
    return new Promise(() => {});
  }
}

// Resolves immediately with a fixed identity: simulates a completed sign-in.
export class FixedIdentityProvider implements IdentityProvider {
  private readonly identity: UserIdentity;

  constructor(identity: UserIdentity) {
    this.identity = identity;
  }

  async signIn(): Promise<UserIdentity> {
    return this.identity;
  }
}

// An IdentityUseCase already "signed in" as `identity` (or signed out, for
// `null`) without exercising the sign-in flow itself.
export function identityUseCaseFor(identity: UserIdentity | null): IdentityUseCase {
  return new IdentityUseCase(new PendingIdentityProvider(), new InMemorySessionStore(identity));
}

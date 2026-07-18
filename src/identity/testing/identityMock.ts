import { IdentityUseCase } from '../identityUseCase';
import type { IdentityProvider, IdentitySignInResult } from '../identityProviderPorts';
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

// Never resolves and never delivers an identity: freezes a rendered gate at the
// signed-out state.
export class PendingIdentityProvider implements IdentityProvider {
  renderInto(): Promise<void> {
    return new Promise(() => {});
  }

  onIdentity(): () => void {
    return () => {};
  }
}

// Delivers a fixed identity as soon as the affordance is "rendered": simulates a
// completed sign-in.
export class FixedIdentityProvider implements IdentityProvider {
  private readonly identity: UserIdentity;
  private listener: ((result: IdentitySignInResult) => void) | undefined;

  constructor(identity: UserIdentity) {
    this.identity = identity;
  }

  async renderInto(): Promise<void> {
    this.listener?.({ ok: true, identity: this.identity });
  }

  onIdentity(listener: (result: IdentitySignInResult) => void): () => void {
    this.listener = listener;
    return () => {
      this.listener = undefined;
    };
  }
}

// An IdentityUseCase already "signed in" as `identity` (or signed out, for
// `null`) without exercising the sign-in flow itself.
export function identityUseCaseFor(identity: UserIdentity | null): IdentityUseCase {
  return new IdentityUseCase(new PendingIdentityProvider(), new InMemorySessionStore(identity));
}

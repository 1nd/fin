import { describe, expect, it, vi } from 'vitest';
import type { IdentityProvider, IdentitySignInResult } from './identityProviderPorts';
import { IdentityUseCase } from './identityUseCase';
import type { SessionStore } from './session/sessionStorePorts';
import { FixedIdentityProvider, InMemorySessionStore } from './testing/identityMock';
import { userIdFromGoogleSubject, type UserIdentity } from './userIdentity';

class ThrowingPersistSessionStore implements SessionStore {
  restore(): UserIdentity | null {
    return null;
  }

  persist(): void {
    throw new Error('quota exceeded');
  }

  clear(): void {}
}

class FailingIdentityProvider implements IdentityProvider {
  async renderInto(): Promise<void> {
    throw new Error('sign-in failed');
  }

  onIdentity(): () => void {
    return () => {};
  }
}

// Delivers each queued result to the listener on demand — simulates the rendered
// affordance driving several attempts (e.g. clicks) from a single subscription.
class ScriptedIdentityProvider implements IdentityProvider {
  private listener: ((result: IdentitySignInResult) => void) | undefined;

  async renderInto(): Promise<void> {}

  onIdentity(listener: (result: IdentitySignInResult) => void): () => void {
    this.listener = listener;
    return () => {
      this.listener = undefined;
    };
  }

  deliver(result: IdentitySignInResult): void {
    this.listener?.(result);
  }
}

const ALICE: UserIdentity = {
  userId: userIdFromGoogleSubject('google-sub-alice'),
  displayName: 'Alice',
  email: 'alice@example.com',
};

describe('userIdFromGoogleSubject', () => {
  it('derives the userId directly from the Google subject', () => {
    expect(userIdFromGoogleSubject('google-sub-alice')).toBe('google-sub-alice');
  });
});

describe('IdentityUseCase', () => {
  it('restores no identity when the session store is empty', () => {
    const useCase = new IdentityUseCase(
      new FixedIdentityProvider(ALICE),
      new InMemorySessionStore(),
    );
    expect(useCase.restore()).toBeNull();
  });

  it('restores a previously persisted identity', () => {
    const sessionStore = new InMemorySessionStore(ALICE);
    const useCase = new IdentityUseCase(new FixedIdentityProvider(ALICE), sessionStore);
    expect(useCase.restore()).toEqual(ALICE);
  });

  it('signs in through the provider and persists the resulting identity', async () => {
    const sessionStore = new InMemorySessionStore();
    const useCase = new IdentityUseCase(new FixedIdentityProvider(ALICE), sessionStore);
    const results: IdentitySignInResult[] = [];
    useCase.onIdentity((result) => results.push(result));

    await useCase.renderInto(document.createElement('div'));

    expect(results).toEqual([{ ok: true, identity: ALICE }]);
    expect(sessionStore.restore()).toEqual(ALICE);
  });

  it('propagates a render failure without persisting anything', async () => {
    const sessionStore = new InMemorySessionStore();
    const useCase = new IdentityUseCase(new FailingIdentityProvider(), sessionStore);

    await expect(useCase.renderInto(document.createElement('div'))).rejects.toThrow(
      'sign-in failed',
    );
    expect(sessionStore.restore()).toBeNull();
  });

  it('clears the persisted session on sign-out', () => {
    const sessionStore = new InMemorySessionStore(ALICE);
    const useCase = new IdentityUseCase(new FixedIdentityProvider(ALICE), sessionStore);

    useCase.signOut();

    expect(useCase.restore()).toBeNull();
  });

  it('delivers every attempt from one subscription — a failed attempt does not silently swallow a later successful one', async () => {
    const sessionStore = new InMemorySessionStore();
    const provider = new ScriptedIdentityProvider();
    const useCase = new IdentityUseCase(provider, sessionStore);
    const results: IdentitySignInResult[] = [];
    useCase.onIdentity((result) => results.push(result));
    await useCase.renderInto(document.createElement('div'));

    provider.deliver({ ok: false, error: new Error('bad token') });
    provider.deliver({ ok: true, identity: ALICE });

    expect(results).toEqual([
      { ok: false, error: new Error('bad token') },
      { ok: true, identity: ALICE },
    ]);
    expect(sessionStore.restore()).toEqual(ALICE);
  });

  it('still reports a successful sign-in when persisting the session fails', async () => {
    // because persisting is best-effort. If it fails, a successful sign-in doesn't degrade into failure.

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const useCase = new IdentityUseCase(
      new FixedIdentityProvider(ALICE),
      new ThrowingPersistSessionStore(),
    );
    const results: IdentitySignInResult[] = [];
    useCase.onIdentity((result) => results.push(result));

    await useCase.renderInto(document.createElement('div'));

    expect(results).toEqual([{ ok: true, identity: ALICE }]);
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to persist identity session; sign-in will not survive a reload',
      expect.any(Error),
    );
    vi.restoreAllMocks();
  });

  it('persists a successful attempt once, no matter how many listeners are subscribed', async () => {
    const sessionStore = new InMemorySessionStore();
    const persist = vi.spyOn(sessionStore, 'persist');
    const useCase = new IdentityUseCase(new FixedIdentityProvider(ALICE), sessionStore);

    useCase.onIdentity(() => {});
    useCase.onIdentity(() => {});
    await useCase.renderInto(document.createElement('div'));

    expect(persist).toHaveBeenCalledTimes(1);
  });
});

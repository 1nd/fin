import { describe, expect, it } from 'vitest';
import type { IdentityProvider } from './identityProviderPorts';
import { IdentityUseCase } from './identityUseCase';
import { FixedIdentityProvider, InMemorySessionStore } from './testing/identityMock';
import { userIdFromGoogleSubject, type UserIdentity } from './userIdentity';

class FailingIdentityProvider implements IdentityProvider {
  async signIn(): Promise<UserIdentity> {
    throw new Error('sign-in failed');
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

    const identity = await useCase.signIn(document.createElement('div'));

    expect(identity).toEqual(ALICE);
    expect(sessionStore.restore()).toEqual(ALICE);
  });

  it('propagates a sign-in failure without persisting anything', async () => {
    const sessionStore = new InMemorySessionStore();
    const useCase = new IdentityUseCase(new FailingIdentityProvider(), sessionStore);

    await expect(useCase.signIn(document.createElement('div'))).rejects.toThrow('sign-in failed');
    expect(sessionStore.restore()).toBeNull();
  });

  it('clears the persisted session on sign-out', () => {
    const sessionStore = new InMemorySessionStore(ALICE);
    const useCase = new IdentityUseCase(new FixedIdentityProvider(ALICE), sessionStore);

    useCase.signOut();

    expect(useCase.restore()).toBeNull();
  });
});

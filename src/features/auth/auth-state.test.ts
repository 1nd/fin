import { stateAfterProfileFetch, stateAfterSignInResult } from './auth-state';

describe('stateAfterSignInResult', () => {
  it('requests a profile fetch on success with an access token', () => {
    expect(stateAfterSignInResult({ type: 'success', accessToken: 'token-1' })).toBe(
      'fetch-profile',
    );
  });

  it('stays signed out when success carries no access token', () => {
    expect(stateAfterSignInResult({ type: 'success' })).toEqual({
      status: 'signed-out',
      error: 'Sign-in did not return an access token.',
    });
  });

  it('stays signed out with the server error message on failure', () => {
    expect(stateAfterSignInResult({ type: 'error', errorMessage: 'access_denied' })).toEqual({
      status: 'signed-out',
      error: 'access_denied',
    });
  });

  it('falls back to a generic message when an error has no message', () => {
    expect(stateAfterSignInResult({ type: 'error' })).toEqual({
      status: 'signed-out',
      error: 'Sign-in failed.',
    });
  });

  it.each(['cancel', 'dismiss', 'locked', 'opened'] as const)(
    'stays signed out with no error when the flow ends as %s',
    (type) => {
      expect(stateAfterSignInResult({ type })).toEqual({ status: 'signed-out', error: null });
    },
  );
});

describe('stateAfterProfileFetch', () => {
  it('signs the user in when the profile fetch succeeds', () => {
    const user = { userId: 'u1', email: 'a@example.com', name: 'A', locale: 'en-US' };
    expect(stateAfterProfileFetch({ user })).toEqual({ status: 'signed-in', user });
  });

  it('stays signed out with the fetch error message on failure', () => {
    expect(stateAfterProfileFetch({ error: new Error('network down') })).toEqual({
      status: 'signed-out',
      error: 'network down',
    });
  });
});

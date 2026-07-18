import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IdentitySignInResult } from '../identityProviderPorts';
import { ConfigurationError, SignInError } from './errors';
import type { GoogleGlobal, GoogleIdConfiguration } from './googleGlobal';
import { GoogleIdentityProvider } from './googleIdentityProvider';

function makeIdToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

const CLIENT_ID = 'test-client-id';
const EXP = Math.floor(Date.now() / 1000) + 3600;

function requireConfig(config: GoogleIdConfiguration | undefined): GoogleIdConfiguration {
  if (!config) throw new Error('google.accounts.id.initialize was not called');
  return config;
}

describe('GoogleIdentityProvider', () => {
  let initializeConfig: GoogleIdConfiguration | undefined;
  const renderButton = vi.fn();

  beforeEach(() => {
    initializeConfig = undefined;
    renderButton.mockClear();
    const google: GoogleGlobal = {
      accounts: {
        id: {
          initialize: (config) => {
            initializeConfig = config;
          },
          renderButton,
        },
      },
    };
    window.google = google;
  });

  afterEach(() => {
    delete window.google;
  });

  it('rejects with a ConfigurationError without rendering when the client id is blank', async () => {
    const provider = new GoogleIdentityProvider('');
    await expect(provider.renderInto(document.createElement('div'))).rejects.toBeInstanceOf(
      ConfigurationError,
    );
    expect(renderButton).not.toHaveBeenCalled();
  });

  it('delivers every attempt from a single render — a rejected click does not swallow a later successful one', async () => {
    const provider = new GoogleIdentityProvider(CLIENT_ID);
    const results: IdentitySignInResult[] = [];
    provider.onIdentity((result) => results.push(result));

    await provider.renderInto(document.createElement('div'));
    const config = requireConfig(initializeConfig);

    // First click on the rendered button: wrong `aud` -> rejected.
    config.callback({
      credential: makeIdToken({
        sub: 'sub-1',
        aud: 'someone-else',
        iss: 'https://accounts.google.com',
        exp: EXP,
      }),
    });

    // Second click on the SAME rendered button (`initialize` was only called once):
    // a valid token this time -> must still reach the subscriber.
    config.callback({
      credential: makeIdToken({
        sub: 'sub-2',
        aud: CLIENT_ID,
        iss: 'https://accounts.google.com',
        name: 'Alice',
        email: 'alice@example.com',
        exp: EXP,
      }),
    });

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ ok: false, error: expect.any(SignInError) });
    expect(results[1]).toEqual({
      ok: true,
      identity: { userId: 'sub-2', displayName: 'Alice', email: 'alice@example.com' },
    });
  });

  it('stops delivering to a listener after it unsubscribes', async () => {
    const provider = new GoogleIdentityProvider(CLIENT_ID);
    const results: IdentitySignInResult[] = [];
    const unsubscribe = provider.onIdentity((result) => results.push(result));
    await provider.renderInto(document.createElement('div'));

    unsubscribe();
    requireConfig(initializeConfig).callback({
      credential: makeIdToken({
        sub: 'sub-1',
        aud: CLIENT_ID,
        iss: 'https://accounts.google.com',
        exp: EXP,
      }),
    });

    expect(results).toEqual([]);
  });
});

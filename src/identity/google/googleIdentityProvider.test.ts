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

  it('does not treat a listener throwing on a successful attempt as a failed attempt', async () => {
    const provider = new GoogleIdentityProvider(CLIENT_ID);
    const results: IdentitySignInResult[] = [];
    provider.onIdentity((result) => {
      results.push(result);
      if (result.ok) throw new Error('listener bug');
    });
    await provider.renderInto(document.createElement('div'));

    const config = requireConfig(initializeConfig);
    const credential = makeIdToken({
      sub: 'sub-1',
      aud: CLIENT_ID,
      iss: 'https://accounts.google.com',
      name: 'Alice',
      email: 'alice@example.com',
      exp: EXP,
    });

    // The listener's own bug propagates as-is rather than being caught and reported back
    // through a second, mislabeled `ok: false` emit.
    expect(() => config.callback({ credential })).toThrow('listener bug');
    expect(results).toEqual([
      {
        ok: true,
        identity: { userId: 'sub-1', displayName: 'Alice', email: 'alice@example.com' },
      },
    ]);
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

// Exercises the real `loadScript` path (script tag creation, `onload`/`onerror`, and the
// cached-promise reset on failure) instead of pre-seeding `window.google`, since that
// bypasses this code entirely.
describe('GoogleIdentityProvider script loading', () => {
  let appendChild: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    delete window.google;
    appendChild = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => node as Node);
  });

  afterEach(() => {
    delete window.google;
    vi.restoreAllMocks();
  });

  function lastAppendedScript(): HTMLScriptElement {
    const call = appendChild.mock.calls.at(-1);
    if (!call) throw new Error('no script was appended');
    return call[0] as HTMLScriptElement;
  }

  it('rejects when the script fails to load', async () => {
    const provider = new GoogleIdentityProvider(CLIENT_ID);

    const rendered = provider.renderInto(document.createElement('div'));
    lastAppendedScript().onerror?.(new Event('error'));

    await expect(rendered).rejects.toThrow('Failed to load Google Sign-In');
  });

  it('rejects when the script loads without initializing window.google', async () => {
    const provider = new GoogleIdentityProvider(CLIENT_ID);

    const rendered = provider.renderInto(document.createElement('div'));
    lastAppendedScript().onload?.(new Event('load'));

    await expect(rendered).rejects.toThrow('Google Sign-In script loaded without initializing');
  });

  it('re-attempts the script load on a fresh renderInto after a failure', async () => {
    const provider = new GoogleIdentityProvider(CLIENT_ID);

    const firstAttempt = provider.renderInto(document.createElement('div'));
    lastAppendedScript().onerror?.(new Event('error'));
    await expect(firstAttempt).rejects.toThrow(SignInError);

    // The failed attempt reset the cached promise, so this second call appends its own
    // script tag rather than staying rejected forever.
    const secondAttempt = provider.renderInto(document.createElement('div'));
    expect(appendChild).toHaveBeenCalledTimes(2);
    window.google = {
      accounts: { id: { initialize: () => {}, renderButton: () => {} } },
    };
    lastAppendedScript().onload?.(new Event('load'));

    await expect(secondAttempt).resolves.toBeUndefined();
  });
});

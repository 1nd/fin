import { describe, expect, it } from 'vitest';
import { decodeGoogleIdToken } from './decodeGoogleIdToken';
import { SignInError } from './errors';

const CLIENT_ID = 'test-client-id';
const EXP = Math.floor(Date.now() / 1000) + 3600;

// base64url, and UTF-8 safe (unlike a bare `btoa(json)`) — matches what GIS actually sends.
function base64UrlEncodeUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeIdToken(payload: Record<string, unknown>): string {
  const header = base64UrlEncodeUtf8(JSON.stringify({ alg: 'none' }));
  const body = base64UrlEncodeUtf8(JSON.stringify(payload));
  return `${header}.${body}.signature`;
}

describe('decodeGoogleIdToken', () => {
  it('decodes non-ASCII display names correctly instead of mangling them', () => {
    const token = makeIdToken({
      sub: 'sub-1',
      aud: CLIENT_ID,
      iss: 'https://accounts.google.com',
      name: '김서연',
      email: 'seoyeon@example.com',
      exp: EXP,
    });

    const identity = decodeGoogleIdToken(token, CLIENT_ID);

    expect(identity.displayName).toBe('김서연');
  });

  it.each([
    ['missing entirely', { aud: CLIENT_ID, iss: 'https://accounts.google.com', exp: EXP }],
    ['an empty string', { sub: '', aud: CLIENT_ID, iss: 'https://accounts.google.com', exp: EXP }],
  ])(
    'rejects a token whose subject is %s — it becomes the storage partition key',
    (_label, payload) => {
      const token = makeIdToken(payload);

      expect(() => decodeGoogleIdToken(token, CLIENT_ID)).toThrow(SignInError);
    },
  );

  it('rejects a token whose audience does not match the configured client id', () => {
    const token = makeIdToken({
      sub: 'sub-1',
      aud: 'someone-else',
      iss: 'https://accounts.google.com',
      exp: EXP,
    });

    expect(() => decodeGoogleIdToken(token, CLIENT_ID)).toThrow(SignInError);
  });

  it('rejects a token from a non-Google issuer', () => {
    const token = makeIdToken({
      sub: 'sub-1',
      aud: CLIENT_ID,
      iss: 'https://evil.example.com',
      exp: EXP,
    });

    expect(() => decodeGoogleIdToken(token, CLIENT_ID)).toThrow(SignInError);
  });

  it('rejects an expired token', () => {
    const token = makeIdToken({
      sub: 'sub-1',
      aud: CLIENT_ID,
      iss: 'accounts.google.com',
      exp: Math.floor(Date.now() / 1000) - 3600,
    });

    expect(() => decodeGoogleIdToken(token, CLIENT_ID)).toThrow(SignInError);
  });

  it('rejects a malformed token', () => {
    expect(() => decodeGoogleIdToken('not-a-jwt', CLIENT_ID)).toThrow(SignInError);
  });
});

// CCA: 4
import { userIdFromGoogleSubject, type UserIdentity } from '../userIdentity';
import { SignInError } from './errors';

const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

interface GoogleIdTokenPayload {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  name?: string;
  email?: string;
  picture?: string;
  locale?: string;
}

// Decodes and checks `sub`/`aud`/`iss`/`exp` as defense-in-depth (`google-signin` D9) — the
// token itself was already obtained directly from Google over HTTPS by Google Identity
// Services, so signature verification against Google's JWKS is left to a future
// server-side boundary (Phase X), not duplicated here.
export function decodeGoogleIdToken(jwt: string, expectedClientId: string): UserIdentity {
  const payload = decodePayload(jwt);

  // `sub` becomes the storage partition key (`userId`, `google-signin` D3) — the one field here that must
  // never be silently accepted as `undefined`, since JSON.parse gives no runtime guarantee
  // the decoded payload actually matches `GoogleIdTokenPayload`.
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new SignInError('ID token is missing a subject');
  }
  if (payload.aud !== expectedClientId) {
    throw new SignInError('ID token audience does not match this app');
  }
  if (!GOOGLE_ISSUERS.includes(payload.iss)) {
    throw new SignInError('ID token issuer is not Google');
  }
  if (payload.exp * 1000 <= Date.now()) {
    throw new SignInError('ID token has expired');
  }

  return {
    userId: userIdFromGoogleSubject(payload.sub),
    displayName: payload.name ?? payload.email ?? '',
    email: payload.email ?? '',
    pictureUrl: payload.picture,
    locale: payload.locale,
  };
}

function decodePayload(jwt: string): GoogleIdTokenPayload {
  const segments = jwt.split('.');
  if (segments.length !== 3) {
    throw new SignInError('Malformed ID token');
  }
  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    // `atob` decodes base64 into a binary/latin1 string, but the JWT payload is UTF-8
    // (e.g. non-ASCII display names) — decode it as bytes through TextDecoder rather
    // than handing atob's latin1 string straight to JSON.parse, which mangles any
    // multi-byte character.
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as GoogleIdTokenPayload;
  } catch (error) {
    throw new SignInError('Could not decode ID token', { cause: error });
  }
}

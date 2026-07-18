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

// Decodes and checks `aud`/`iss`/`exp` as defense-in-depth (`google-signin` D9) — the token
// itself was already obtained directly from Google over HTTPS by Google Identity Services, so
// signature verification against Google's JWKS is left to a future
// server-side boundary (Phase X), not duplicated here.
export function decodeGoogleIdToken(jwt: string, expectedClientId: string): UserIdentity {
  const payload = decodePayload(jwt);

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
    const json = atob(base64);
    return JSON.parse(json) as GoogleIdTokenPayload;
  } catch (error) {
    throw new SignInError('Could not decode ID token', { cause: error });
  }
}

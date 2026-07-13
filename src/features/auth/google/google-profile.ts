// CCA: 3
import type { AuthUser } from '../auth-types';

const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

interface GoogleUserInfoResponse {
  sub: string;
  email?: string;
  name?: string;
  locale?: string;
}

/**
 * Exchanges an access token (from Google Sign-In, scoped with `openid profile email`) for the
 * account's stable `sub` identifier and profile fields -- the basis for the app's `userId`.
 */
export async function fetchGoogleProfile(accessToken: string): Promise<AuthUser> {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Google profile (status ${response.status})`);
  }
  const data = (await response.json()) as GoogleUserInfoResponse;
  return {
    userId: data.sub,
    email: data.email ?? null,
    name: data.name ?? null,
    locale: data.locale ?? null,
  };
}

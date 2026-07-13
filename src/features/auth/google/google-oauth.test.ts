import * as AuthSession from 'expo-auth-session';
import { DRIVE_FILE_SCOPE, GOOGLE_DISCOVERY, googleAuthRequestConfig } from './google-oauth';

// `makeRedirectUri` resolves the app's URL scheme from the runtime environment, which doesn't
// exist under jest. The redirect URI's value is environment-derived and not what these tests pin
// down; the request params (response type, PKCE, scopes) are.
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'http://localhost:8081'),
}));

describe('googleAuthRequestConfig', () => {
  // Builds the authorization URL through the real expo-auth-session request machinery (not just
  // inspecting our config object), so a library upgrade that changes what the config produces on
  // the wire is caught here too.
  async function buildAuthUrl(): Promise<URL> {
    const request = new AuthSession.AuthRequest(googleAuthRequestConfig('test-client-id'));
    return new URL(await request.makeAuthUrlAsync(GOOGLE_DISCOVERY));
  }

  it('uses the implicit (token) flow', async () => {
    const url = await buildAuthUrl();

    expect(url.searchParams.get('response_type')).toBe('token');
  });

  it('sends no PKCE params, which Google rejects on implicit-flow requests (Error 400: invalid_request)', async () => {
    const url = await buildAuthUrl();

    expect(url.searchParams.has('code_challenge')).toBe(false);
    expect(url.searchParams.has('code_challenge_method')).toBe(false);
  });

  it('requests the identity scopes plus drive.file for backup', async () => {
    const url = await buildAuthUrl();

    const scopes = (url.searchParams.get('scope') ?? '').split(' ');
    expect(scopes).toEqual(
      expect.arrayContaining(['openid', 'profile', 'email', DRIVE_FILE_SCOPE]),
    );
  });
});

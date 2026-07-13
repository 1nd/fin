// CCA: 3
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Required once per app load so a completed web auth popup/redirect resolves back to the caller.
WebBrowser.maybeCompleteAuthSession();

/**
 * Google's OAuth 2.0 endpoints, used directly with `AuthSession.useAuthRequest` rather than the
 * `expo-auth-session/providers/google` wrapper, which is deprecated.
 */
export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * Requested alongside the identity scopes at sign-in time (design Decision 9) so Drive backup
 * never needs a separate, later consent step.
 */
export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export const GOOGLE_SIGN_IN_SCOPES = ['openid', 'profile', 'email', DRIVE_FILE_SCOPE];

export function googleAuthRequestConfig(clientId: string): AuthSession.AuthRequestConfig {
  return {
    clientId,
    scopes: GOOGLE_SIGN_IN_SCOPES,
    responseType: AuthSession.ResponseType.Token,
    // `useAuthRequest` sends PKCE params by default, but Google rejects them on implicit-flow
    // (token) requests with "Parameter not allowed for this message type: code_challenge_method".
    // PKCE only applies to the authorization-code flow, so this must stay off while
    // `responseType` is Token.
    usePKCE: false,
    redirectUri: AuthSession.makeRedirectUri(),
  };
}

export function useGoogleAuthRequest(clientId: string) {
  return AuthSession.useAuthRequest(googleAuthRequestConfig(clientId), GOOGLE_DISCOVERY);
}

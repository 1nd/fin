// CCA: 4
import type { IdentityProvider, IdentitySignInResult } from '../identityProviderPorts';
import { decodeGoogleIdToken } from './decodeGoogleIdToken';
import { ConfigurationError, SignInError } from './errors';
import type { GoogleGlobal } from './googleGlobal';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export class GoogleIdentityProvider implements IdentityProvider {
  private readonly clientId: string | undefined;
  private scriptLoadPromise: Promise<GoogleGlobal> | undefined;
  private readonly listeners = new Set<(result: IdentitySignInResult) => void>();

  constructor(clientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    this.clientId = clientId;
  }

  async renderInto(container: HTMLElement): Promise<void> {
    if (!this.clientId) {
      throw new ConfigurationError('VITE_GOOGLE_CLIENT_ID is not configured');
    }
    const google = await this.loadScript();
    const clientId = this.clientId;

    // `initialize` is called once per render; the rendered button re-invokes `callback` on
    // every click for as long as it stays mounted, so each firing is forwarded to
    // `onIdentity` rather than settling a one-shot Promise (see the port doc for why — a
    // retry after a failed attempt was silently dropped otherwise). Note there is no
    // `error_callback` here: `IdConfiguration` (the `google.accounts.id` API this adapter
    // uses) doesn't expose one — that field only exists on the unrelated OAuth2 token
    // client (`google.accounts.oauth2`). GIS gives no signal at all when a user closes the
    // button's popup without picking an account; the sign-in screen is simply left as-is
    // and the button can be clicked again.
    google.accounts.id.initialize({
      client_id: clientId,
      // Forward-compatible insurance (`google-signin` D1): suppresses Google Identity Services' silent
      // auto-return of a single previously-approved account. The button's
      // account chooser is unaffected either way.
      auto_select: false,
      callback: (response) => {
        let result: IdentitySignInResult;
        try {
          result = { ok: true, identity: decodeGoogleIdToken(response.credential, clientId) };
        } catch (error) {
          result = { ok: false, error };
        }
        this.emit(result);
      },
    });
    container.replaceChildren();
    google.accounts.id.renderButton(container, { type: 'standard' });
  }

  onIdentity(listener: (result: IdentitySignInResult) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(result: IdentitySignInResult): void {
    for (const listener of this.listeners) listener(result);
  }

  private loadScript(): Promise<GoogleGlobal> {
    this.scriptLoadPromise ??= new Promise<GoogleGlobal>((resolve, reject) => {
      if (window.google) {
        resolve(window.google);
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google) {
          resolve(window.google);
        } else {
          reject(new SignInError('Google Sign-In script loaded without initializing'));
        }
      };
      script.onerror = () => reject(new SignInError('Failed to load Google Sign-In'));
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      this.scriptLoadPromise = undefined;
      throw error;
    });
    return this.scriptLoadPromise;
  }
}

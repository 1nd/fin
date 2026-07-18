// CCA: 4
import type { IdentityProvider } from '../identityProviderPorts';
import type { UserIdentity } from '../userIdentity';
import { decodeGoogleIdToken } from './decodeGoogleIdToken';
import { ConfigurationError, SignInError } from './errors';
import type { GoogleGlobal } from './googleGlobal';

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export class GoogleIdentityProvider implements IdentityProvider {
  private readonly clientId: string;
  private scriptLoadPromise: Promise<GoogleGlobal> | undefined;

  constructor(clientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID) {
    this.clientId = clientId;
  }

  async signIn(container: HTMLElement): Promise<UserIdentity> {
    if (!this.clientId) {
      throw new ConfigurationError('VITE_GOOGLE_CLIENT_ID is not configured');
    }
    const google = await this.loadScript();
    const clientId = this.clientId;

    return new Promise<UserIdentity>((resolve, reject) => {
      google.accounts.id.initialize({
        client_id: clientId,
        // Forward-compatible insurance (`google-signin` D1): suppresses Google Identity Services' silent
        // auto-return of a single previously-approved account. The button's
        // account chooser is unaffected either way.
        auto_select: false,
        callback: (response) => {
          try {
            resolve(decodeGoogleIdToken(response.credential, clientId));
          } catch (error) {
            reject(error);
          }
        },
        error_callback: (error) => {
          reject(new SignInError(error.message ?? 'Google Sign-In failed'));
        },
      });
      container.replaceChildren();
      google.accounts.id.renderButton(container, { type: 'standard' });
    });
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

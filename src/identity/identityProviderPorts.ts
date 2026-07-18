// CCA: 2
// Ports that contain contracts for the IdP (Identity Provider -- https://en.wikipedia.org/wiki/Identity_provider)

import type { UserIdentity } from './userIdentity';

// `container` hosts the provider's sign-in affordance (e.g. the rendered
// "Sign In With Google" button); the port stays token-neutral (D2) — it
// always resolves a decoded UserIdentity, never a provider-shaped credential.
export interface IdentityProvider {
  signIn(container: HTMLElement): Promise<UserIdentity>;
}

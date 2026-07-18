// CCA: 2
// Ports that contain contracts for the IdP (Identity Provider -- https://en.wikipedia.org/wiki/Identity_provider)

import type { UserIdentity } from './userIdentity';

// The outcome of a single sign-in attempt, delivered through `onIdentity`; the port stays
// token-neutral (`google-signin` D2) — always a decoded UserIdentity, never a
// provider-shaped credential.
export type IdentitySignInResult =
  | { readonly ok: true; readonly identity: UserIdentity }
  | { readonly ok: false; readonly error: unknown };

// `container` hosts the provider's sign-in affordance (e.g. the rendered "Sign In With
// Google" button). `renderInto` mounts it once, but the affordance itself then drives an
// unbounded number of attempts — every click — so attempt outcomes arrive one at a time
// through `onIdentity` rather than as `renderInto`'s resolution: a single Promise can only
// ever settle once, and collapsing every attempt onto it silently drops all but the first
// (retry-after-failure regression found in review).
export interface IdentityProvider {
  renderInto(container: HTMLElement): Promise<void>;
  onIdentity(listener: (result: IdentitySignInResult) => void): () => void;
}

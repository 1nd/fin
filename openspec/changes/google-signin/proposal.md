## Why

Every Fin record is keyed by `userId`, but no real identity exists yet: preferences live under the `local-placeholder` id and anyone opening the app is the same anonymous user. The plan places Google Sign-In early on purpose — *before any data-entry change* — so that when accounts, transactions, and backups arrive, every record is born under its owner's Google id and no "local user" migration policy ever has to exist. Routing (H) just landed, giving the sign-in gate the final navigation model to preserve a visitor's intended destination across signing in. This change makes identity real.

## What Changes

- **Sign-in gate:** the app requires a Google identity before it renders any app view. A signed-out visit to an addressable URL (e.g. `/settings`) shows a localized sign-in screen and, after signing in, lands on the originally intended view — the URL is never redirected.
- **Google Sign-In (popup UX, no server):** authenticate via Google Identity Services entirely in the browser — an ID-token flow with no redirect URIs, only JavaScript origins whitelisted on the OAuth client. The Google account's stable subject becomes the `userId`; its profile (name/email/picture) and `locale` claim are captured for display and preference defaults.
- **Per-account data partitions:** multiple Google accounts on the same browser are distinct users with fully separate data. Signing in seeds the current `userId`; all per-user storage (today: preferences) reads and writes under it.
- **Sign-out and account switching:** the shell presents the signed-in account and a control to sign out; signing out returns to the gate, and signing in as a different account swaps to that account's partition.
- **Session persistence:** the resolved identity is stored locally and restored on reload, so the user signs in once, not every visit; sign-out clears it. (Phase 1 is *identity convenience, not a security boundary* — anyone with browser access can still see the data.)
- **Account locale now feeds preference defaults:** the settings cascade's account-locale tier — dormant until now — becomes active, so a new user's language/number-format defaults come from their Google account ahead of browser locale.
- The `local-placeholder` user id is retired; preferences persist under the signed-in Google `userId`.

## Capabilities

### New Capabilities

- `identity`: Google Sign-In authentication in the browser (popup, no server), the sign-in gate that requires an identity before any app view renders while preserving the intended URL, presentation of the signed-in account with sign-out, account switching across distinct Google accounts as separate data partitions, local session persistence/restore across reload, and the `userId` source that keys all per-user storage.

### Modified Capabilities

- `settings`: the default cascade's account-locale tier becomes active (the Google account locale now supplies language/number-format defaults ahead of browser locale, replacing "absent until Google Sign-In lands"); preferences persist under the signed-in Google `userId` (the placeholder id is retired).

## Impact

- **New code:** identity entity (layer 1: `UserIdentity`, userId derivation); identity use case + provider/session ports (layers 2–3); Google Identity Services adapter and a local session-store adapter (layer 4); React identity context + `useIdentity` hook; the sign-in screen and the shell's account control; en/id catalog strings for sign-in, account menu, and sign-out.
- **Modified code:** `src/settings/PreferencesContext.tsx` (takes `userId` and account locale from the identity context instead of `LOCAL_PLACEHOLDER_USER_ID`); the composition root / `src/app/App.tsx` (identity provider + gate wrap the routed app); `src/storage/constants.ts` (`LOCAL_PLACEHOLDER_USER_ID` retired or relocated); `AppShell` hosts the account control.
- **Dependencies & config:** Google Identity Services client script (loaded from Google, external origin — a hosting/CSP note); a Google Cloud OAuth **client ID** supplied via build env (e.g. `VITE_GOOGLE_CLIENT_ID`) with authorized JavaScript origins (localhost for dev), no redirect URIs, no client secret, no server.
- **Deferred:** Google **Drive** authorization scope is *not* requested here — it belongs to `(D) backup`, requested incrementally when first needed.
- **Systems:** a Google Cloud project with an OAuth client configured for the app's origins. No storage-schema, i18n-mechanism, theming, or routing-library changes.
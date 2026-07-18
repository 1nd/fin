## 1. Config & Google Identity Services (GIS) prerequisites

- [x] 1.1 Create a Google Cloud OAuth **client id** (Web) with the app's JavaScript origins (localhost dev origin) and **no redirect URIs**; record it for the build env
- [x] 1.2 Wire `VITE_GOOGLE_CLIENT_ID` into the Vite env (with an `.env.example` / documented entry); do not commit a real secret (there is none — client id only)
- [x] 1.3 Load the GIS client script (`https://accounts.google.com/gsi/client`) and note the `script-src`/`connect-src`/`frame-src` allowance for `accounts.google.com` for later hosting/CSP (README in §9)

## 2. Identity core (CCA layers 1–2)

- [x] 2.1 Add the `UserIdentity` entity (layer 1): `userId`, `displayName`, `email`, `pictureUrl?`, `locale?`, plus the pure rule deriving `userId` from the Google subject (`sub`)
- [x] 2.2 Define the `IdentityProvider` and `SessionStore` ports (layer 2): `signIn()`, `restore()`/persist/clear
- [x] 2.3 Implement `IdentityUseCase` (layer 2): `restore()`, `signIn()`, `signOut()`, exposing the current identity, orchestrating the two ports; unit-tested against a mock `IdentityProvider`

## 3. Adapters (CCA layer 4)

- [x] 3.1 Implement the GIS `IdentityProvider` adapter: render/trigger "Sign In With Google" (button, `auto_select: false`), decode the ID token into `UserIdentity`; a missing/blank client id surfaces a configuration error (no crash)
- [x] 3.2 Verify the decoded token's `aud` (matches `VITE_GOOGLE_CLIENT_ID`), `iss` (Google), and `exp` before accepting it (defense-in-depth, D9); reject otherwise with a localized error
- [x] 3.3 Implement the `SessionStore` adapter over `localStorage` (single well-known key), storing the decoded `UserIdentity` and clearing it on sign-out

## 4. Identity context & the gate

- [x] 4.1 Add the React `IdentityContextProvider` context + `useIdentity()` hook (layer 4), restoring the session at startup and exposing identity + `signIn`/`signOut`
- [x] 4.2 Wrap the app at the composition root (`src/app/App.tsx` / `main.tsx`) with the identity context and the **gate**: no identity → render the sign-in screen (URL untouched, no redirect); identity present → render `PreferencesProvider` → `AppShell` → `Routes`

## 5. Sign-in screen & account control (UI + i18n)

- [x] 5.1 Build the standalone sign-in screen (token-themed, responsive, *outside* `AppShell`) hosting the Google button; localized notice for sign-in failure/cancellation and for missing config
- [x] 5.2 Add the account control to `AppShell`: show the signed-in account (name/email) and a sign-out button (explicit gesture, not an action URL)
- [x] 5.3 Add en/id catalog strings for the sign-in screen, config/error notices, account label, and sign-out (`src/i18n/resources/en.json`, `id.json`); no hardcoded user-facing text
- [x] 5.4 Add a short localized privacy note on the sign-in screen (what is read from Google, that it stays on-device) per D9; its strings go in the en/id catalogs (5.3)

## 6. Settings integration (re-key + account locale)

- [x] 6.1 Generalize `PreferencesProvider` (`src/settings/PreferencesContext.tsx`) to take `userId: string | null` and `accountLocale: string | null` from `useIdentity()`: rebuild `SettingsUseCase` and reload overrides when `userId` changes; with `userId === null` resolve the browser cascade and skip persistence
- [x] 6.2 Pass `accountLocale` into `resolvePreferences`/`getEffectivePreferences` so the account-locale cascade tier is active (no change to the pure `resolvePreferences` function itself)

## 7. Retire the placeholder

- [x] 7.1 Remove `LOCAL_PLACEHOLDER_USER_ID` from production paths (`src/storage/constants.ts` and its usage); keep only if a test needs a literal. No placeholder-to-Google data migration (by design)

## 8. Tests

- [x] 8.1 Unit-test `IdentityUseCase` (restore/sign-in/sign-out) and the `UserIdentity` userId derivation against the mock provider and an in-memory session store
- [x] 8.2 Component-test the gate: signed-out renders the sign-in screen with the URL intact; completing sign-in (mock provider) lands on the originally requested view (e.g. direct `/settings`); sign-out returns to the gate
- [x] 8.3 Test settings re-keying: preferences load/persist under the signed-in `userId`; account locale supplies defaults ahead of browser locale; switching to a second account does not see the first account's override
- [x] 8.4 Run `npm run test` and `npm run typecheck`; all green

## 9. Documentation & verification

- [x] 9.1 README: document `VITE_GOOGLE_CLIENT_ID` setup, the JavaScript-origins whitelist (no redirect URIs, no server), and the `accounts.google.com` CSP/hosting allowance
- [x] 9.2 Manual verification in a real browser (per AGENTS.md): sign in with Google (popup, no redirect); reload keeps the session; sign out returns to the gate; sign in as a second Google account and confirm separate preferences; a direct visit to `/settings` while signed out lands on Settings after sign-in; sign-in screen renders localized in en and id at phone/tablet/desktop widths
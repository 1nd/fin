## 1. Config & Google Identity Services (GIS) prerequisites

- [x] 1.1 Create a Google Cloud OAuth **client id** (Web) with the app's JavaScript origins (localhost dev origin) and **no redirect URIs**; record it for the build env
- [x] 1.2 Wire `VITE_GOOGLE_CLIENT_ID` into the Vite env (with an `.env.example` / documented entry); do not commit a real secret (there is none — client id only)
- [x] 1.3 Load the GIS client script (`https://accounts.google.com/gsi/client`) and note the `script-src`/`connect-src`/`frame-src` allowance for `accounts.google.com` for later hosting/CSP (README in §9)

## 2. Identity core (CCA layers 1–2)

- [x] 2.1 Add the `UserIdentity` entity (layer 1): `userId`, `displayName`, `email`, `pictureUrl?`, `locale?`, plus the pure rule deriving `userId` from the Google subject (`sub`)
- [x] 2.2 Define the `IdentityProvider` and `SessionStore` ports (layer 2): `renderInto()`/`onIdentity()` (subscription, not a one-shot promise — a rendered affordance can drive unbounded attempts), `restore()`/persist/clear
- [x] 2.3 Implement `IdentityUseCase` (layer 2): `restore()`, `renderInto()`, `onIdentity()`, `signOut()`, exposing the current identity, orchestrating the two ports; unit-tested against a mock `IdentityProvider`

## 3. Adapters (CCA layer 4)

- [x] 3.1 Implement the GIS `IdentityProvider` adapter: render/trigger "Sign In With Google" (button, `auto_select: false`), decode the ID token into `UserIdentity`; a missing/blank client id surfaces a configuration error (no crash)
- [x] 3.2 Verify the decoded token's `aud` (matches `VITE_GOOGLE_CLIENT_ID`), `iss` (Google), and `exp` before accepting it (defense-in-depth, D9); reject otherwise with a localized error
- [x] 3.3 Implement the `SessionStore` adapter over `localStorage` (single well-known key), storing the decoded `UserIdentity` and clearing it on sign-out

## 4. Identity context & the gate

- [x] 4.1 Add the React `IdentityContextProvider` context + `useIdentity()` hook (layer 4), restoring the session at startup and exposing identity + `signIn`/`signOut`
- [x] 4.2 Wrap the app at the composition root (`src/app/App.tsx` / `main.tsx`) with the identity context and the **gate**: no identity → render `PreferencesProvider` (its `userId: null` browser-cascade path, D5) → the sign-in screen (URL untouched, no redirect); identity present → render `PreferencesProvider` → `AppShell` → `Routes`. Both branches need `PreferencesProvider` — it's the only thing that ever calls `i18next.changeLanguage`/sets the theme, so a bare sign-in screen outside it never gets localized

## 5. Sign-in screen & account control (UI + i18n)

- [x] 5.1 Build the standalone sign-in screen (token-themed, responsive, *outside* `AppShell`) hosting the Google button; localized notice for sign-in failure/cancellation and for missing config; when the affordance itself never rendered (e.g. script-load failure), show a localized retry control — a rejected token instead leaves the real button rendered and already retryable, so it gets no separate control
- [x] 5.2 Add the account control to `AppShell`: show the signed-in account (name/email) and a sign-out button (explicit gesture, not an action URL)
- [x] 5.3 Add en/id catalog strings for the sign-in screen, config/error notices, the retry control, account label, and sign-out (`src/i18n/resources/en.json`, `id.json`); no hardcoded user-facing text
- [x] 5.4 Add a short localized privacy note on the sign-in screen (what is read from Google, that it stays on-device) per D9; its strings go in the en/id catalogs (5.3)

## 6. Settings integration (re-key + account locale)

- [x] 6.1 Generalize `PreferencesProvider` (`src/settings/PreferencesContext.tsx`) to take `userId: string | null` and `accountLocale: string | null` from `useIdentity()`: rebuild `SettingsUseCase` and reload overrides when `userId` changes; with `userId === null` resolve the browser cascade and skip persistence
- [x] 6.2 Pass `accountLocale` into `resolvePreferences`/`getEffectivePreferences` so the account-locale cascade tier is active (no change to the pure `resolvePreferences` function itself)

## 7. Retire the placeholder

- [x] 7.1 Remove `LOCAL_PLACEHOLDER_USER_ID` from production paths (`src/storage/constants.ts` and its usage); keep only if a test needs a literal. No placeholder-to-Google data migration (by design)

## 8. Tests

- [x] 8.1 Unit-test `IdentityUseCase` (restore/sign-in/sign-out) and the `UserIdentity` userId derivation against the mock provider and an in-memory session store
- [x] 8.2 Component-test the gate: signed-out renders the sign-in screen with the URL intact; **signed-out with an Indonesian browser locale renders the sign-in screen entirely from the Indonesian catalog** (exercises `PreferencesProvider`'s `userId: null` browser-cascade path — the spec's "Sign-in screen is localized" scenario); completing sign-in (mock provider) lands on the originally requested view (e.g. direct `/settings`); sign-out returns to the gate. Component-test `SignInPage` directly (`SignInPage.test.tsx`): a render failure (button never reached the DOM) shows a retry control and retrying succeeds; a rejected token *after* the button already rendered shows no separate retry control, since the real button is already clickable again
- [x] 8.3 Test settings re-keying: preferences load/persist under the signed-in `userId`; account locale supplies defaults ahead of browser locale; switching to a second account does not see the first account's override
- [x] 8.4 Run `npm run test` and `npm run typecheck`; all green

## 9. Documentation & verification

- [x] 9.1 README: document `VITE_GOOGLE_CLIENT_ID` setup, the JavaScript-origins whitelist (no redirect URIs, no server), and the `accounts.google.com` CSP/hosting allowance
- [ ] 9.2 Manual verification in a real browser (per AGENTS.md). Scenarios:
  - Sign in with Google (popup, no redirect).
  - Dismissing the popup doesn't break the button: click the button, then close the popup without picking an account. GIS exposes no signal for this on the API this adapter uses (`google.accounts.id` has no `error_callback` — that field only exists on the unrelated OAuth2 token client), so expect no visible change, not a notice. Then click the button again on the same still-open screen and complete sign-in successfully, confirming the button still works after a dismissed attempt.
  - Retry-after-failure (bug #1: a rejected `aud`/`iss`/`exp`/`sub` token followed by a valid one through the same button registration) is **not manually reproducible** — a genuine Google-issued token always passes those checks, so a real browser session can't manufacture the failing-then-succeeding pair. This regression is covered by automated tests instead: `identityUseCase.test.ts` and `googleIdentityProvider.test.ts`.
  - Reload keeps the session.
  - Sign out returns to the gate.
  - Sign in as a second Google account and confirm separate preferences.
  - Non-ASCII name isn't mangled: sign in with a Google account whose display name contains non-ASCII characters (e.g. accented letters or a CJK/Hangul name) and confirm it renders correctly in the account label, not mangled.
  - A direct visit to `/settings` while signed out lands on Settings after sign-in
  - Sign-in screen renders localized in en and id at phone/tablet/desktop widths
  - `locale` claim reachability — **verified absent (2026-07-19)**: with the test account's Google-side language set to differ from the browser's, a fresh first sign-in persisted a `fin.identity.session` value with no `locale` field, and defaults fell through to browser locale. Google no longer issues the claim; the account-locale tier can never receive data in production. Decision: the tier is dropped (design.md D10; §10 below).

## 10. Drop the account-locale tier (D10 — follow-up to 9.2's verified finding)

- [ ] 10.1 Remove `locale` from the `UserIdentity` entity and stop reading the `locale` claim in `decodeGoogleIdToken` (persisted sessions still carrying a `locale` field restore fine — the session validator ignores unknown fields; no migration)
- [ ] 10.2 Collapse the account-locale parameter out of `resolvePreferences`/`getEffectivePreferences` (cascade: browser locale → fallback) and stop threading `accountLocale` through `PreferencesProvider`
- [ ] 10.3 Update tests: remove account-locale fixtures and the account-locale-beats-browser scenario; re-key/partition and override-beats-cascade tests stay
- [ ] 10.4 Run `npm run test` and `npm run typecheck`; all green
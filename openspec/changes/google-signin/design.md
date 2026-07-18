## Context

Today the app has no identity: `PreferencesProvider` constructs its use case with `LOCAL_PLACEHOLDER_USER_ID` (`src/storage/constants.ts`), IndexedDB stores are keyed `[userId, key]` against that constant, and `resolvePreferences(accountLocale, browserLocale, overrides)` already accepts an `accountLocale` argument that is always passed `null`. Routing (H) landed a `BrowserRouter` at the composition root (`src/app/main.tsx`) with `Routes` in `App.tsx`; navigation is URL-driven. The app is a Vite + React 19 SPA, all UI in CCA layer 4, storage/adapters below.

Constraints from `plan.md` ("Identity, storage, backup"; "Architecture"):

- Google Sign-In, **required before any data entry**, landing before every data-entry change so records are born under their owner's Google id — **no "local user" migration policy ever exists**.
- Multiple Google accounts on one browser are **distinct users with fully separate data partitions**; sign-out / switching is in scope.
- Phase 1 sign-in is **identity convenience, not a security boundary** — anyone with browser access can see the data.
- **No server:** popup OAuth UX; only JavaScript origins are whitelisted on the OAuth client, no redirect URIs.
- Identity is a **swappable layer-4 adapter** behind a port.
- All per-user storage **keyed by `userId` from day one**; the placeholder retires when sign-in lands.

## Goals / Non-Goals

**Goals:**

- Require a signed-in Google identity before any app view renders, preserving the intended URL across sign-in.
- Authenticate in the browser with no server and no redirect URIs; derive a stable `userId` and capture profile + locale.
- Partition per-user storage by the signed-in `userId`; support sign-out and switching between accounts.
- Persist the session locally so returning users are not re-prompted; restore it on reload.
- Activate the settings cascade's account-locale tier; retire the placeholder id.
- Confine Google to a layer-4 adapter behind a port so the IdP (identity provider) or a Phase-X server session is swappable.

**Non-Goals:**

- Google **Drive** authorization / backup — that is `(D) backup`, which requests the Drive scope incrementally when first needed. This change requests identity only.
- A real security boundary: no server-side token validation, no token refresh, no re-authentication on reload. Phase X adds the server that makes identity a boundary.
- Simultaneous multi-session — Fin holding two live identities at once (Gmail-style account toggling, per-tab identity, multiple partitions active in the same session). At most one Fin identity is ever active. Switching to a different Google account (e.g. a friend trying Fin on the same browser) is in scope and supported: it replaces the active identity via sign-out → sign-in — clicking the "Sign In With Google" button always opens Google's account chooser (D1), so each user picks their own account explicitly rather than the app silently reusing the previous one. The outgoing user's data is untouched, just dormant, keyed by their own `sub` (D3) until they sign back in. Whether Google itself keeps other accounts signed in at the browser level is irrelevant to Fin, which only tracks the `sub` of its current ID token.
- Account linking/merging across providers, or provisioning/registration flows (Google Sign-In replaces registration by design).
- A pre-sign-in language switcher is not expected in Phase 1. The sign-in screen follows browser locale (the account-locale cascade tier is absent until sign-in), and the Google button self-localizes; account locale then any override take over on sign-in, so a mismatch is confined to one pre-auth screen. A switcher is awkward precisely here — preference persistence is keyed by `userId` and none exists yet, so persisting a choice would need a fourth locale source outside the per-user cascade. If real friction appears (e.g. shared-device users whose browser locale differs from their language), open a discussion; nothing in the spec precludes adding one later.

## Decisions

### D1 — Google Identity Services, ID-token flow (not the access-token / auth-code flow)

Phase 1 needs **authentication** — a stable per-account id plus profile and locale — not **authorization** to call Google APIs. Google Identity Services (GIS) "Sign In With Google" issues an **ID token** (a JWT with `sub`, `name`, `email`, `picture`, `locale`) via a popup/embedded flow that uses only whitelisted JavaScript origins and **no redirect URIs** — exactly the no-server constraint. The `sub` claim is the `userId`; the other claims drive display and preference defaults.

Alternatives considered:

- **OAuth 2.0 authorization-code + PKCE** — the general path when you need access tokens (e.g. Drive later). Rejected for this change: it wants a redirect/callback route and yields access/refresh tokens we have nothing to do with yet; least-privilege says request the Drive scope in `(D)` via GIS incremental authorization (a separate token client), not here. Deferring keeps this change to pure identity.
- **Firebase Authentication** — turnkey, but drags in the Firebase SDK and a backend-service mental model for what is, in Phase 1, a client-only identity convenience; it would pre-commit an infra direction the plan defers to Phase X. Rejected as over-scoped.
- **Hand-rolled OIDC** — token parsing, nonce/state, JWKS handling are precisely the footguns a maintained library absorbs. Rejected.

GIS renders the **"Sign In With Google" button** on the sign-in screen. Clicking it always opens Google's account chooser — listing every Google account currently signed in on the browser, plus "Use another account" — so each user (e.g. two friends sharing a laptop, each already signed into their own Google account) picks their own account explicitly; this is inherent to the button, independent of any GIS option. `auto_select: false` is set as forward-compatible insurance for a different path: it suppresses GIS's *silent* auto-return of a single previously-approved account (the behavior One Tap relies on), which would otherwise sign a user in with no interaction at all. It has no effect on the button's chooser and is largely inert while Phase 1 ships button-only. One Tap is an optional later enhancement, not required here.

### D2 — Identity behind a port; Google adapter + mock for tests

A layer-2 `IdentityProvider` port exposes `signIn(): Promise<UserIdentity>` and any teardown; a layer-4 **GIS adapter** implements it — the only production implementation, since no "local user" adapter exists (D8). Tests use an in-memory **mock** implementing the same port: this keeps the seam honest and makes the use case testable in jsdom, which cannot run GIS. Swapping to a Phase-X server-backed session, or another IdP, replaces the adapter and touches nothing above it.

**Cross-platform (Phase Y — iOS/Android):** this port *is* the seam that lets native ports land without reworking identity. The entity, use case, and ports (layers 1–2) port unchanged; the GIS adapter, the `SessionStore` adapter, and the sign-in UI (layer 4) are re-implemented per platform — Android via Credential Manager, iOS via the GoogleSignIn SDK — each returning the *same* `UserIdentity` from a Google ID token. Two invariants keep this cheap and must hold: (a) **the port stays token-neutral** — `signIn()` returns a decoded `UserIdentity`, never a GIS/JWT-shaped credential, so no web type leaks into a native adapter; (b) the gate reads identity state, never URLs (see D5), so a URL-less native navigation stack re-expresses the same decision without touching the use case. Combined with `userId = sub` (D3, stable for one account across platforms under a single Google Cloud project), a user signs in on any platform as the same user — no identity rework, only per-platform adapters and config.

**CCA layering:**

- **Layer 1 (entity):** `UserIdentity` (`userId`, `displayName`, `email`, `pictureUrl?`, `locale?`) and the pure rule deriving `userId` from the Google subject.
- **Layer 2 (use case + ports):** `IdentityUseCase` — `restore()`, `signIn()`, `signOut()`, exposing the current identity — orchestrating the `IdentityProvider` and `SessionStore` ports it owns and depends on (dependency inversion: the port belongs to the layer that calls it, not the adapter ring that implements it).
- **Layer 4 (frameworks):** GIS adapter; `SessionStore` adapter; React `IdentityContextProvider`/`useIdentity` context; the sign-in screen; the shell's account control.

### D3 — `userId` is the Google subject (`sub`), not email

`sub` is stable and opaque per account; email is mutable and reassignable, so keying storage by it would silently repartition a user's data if their address changed. Email/name/picture are display only; `locale` feeds the settings cascade. This makes "distinct Google accounts are distinct users" fall out of the key: different `sub` → different `[userId, …]` rows, no cross-account visibility.

### D4 — Session persisted locally as the decoded identity; restored synchronously-ish at startup

A returning user should not re-authenticate on every reload — a **durable UX goal that holds in every phase**, not a Phase-1 concession. What Phase 1's *not-a-security-boundary* status relaxes is only the *mechanism*: the persisted session can be a plain local identity with no validation. On successful sign-in the **decoded `UserIdentity`** (not the raw JWT — Phase 1 never re-validates or calls APIs, so holding a token-shaped credential buys nothing) is written through a `SessionStore` port and restored on the next load. Sign-out removes it. When Phase X makes identity a real boundary, that same reload UX is preserved by a server-validated, refreshable session (real expiry, revocation) behind the same `SessionStore` port — the boundary governs how a session is *trusted and expired*, never *whether it survives a reload*.

The `SessionStore` adapter uses **`localStorage`** (behind the port), keyed by a single well-known key — not the per-user IndexedDB. Rationale: the session is the *pointer to who the user is*, needed before any `userId` exists, so it cannot live in per-user-keyed storage; a single synchronous read at startup avoids a flash of the sign-in screen for already-signed-in users. `navigator.storage.persist()` (already requested at startup) covers `localStorage` under the same origin. A tampered session can only impersonate a user who already has full browser access — no worse than the stated Phase-1 posture. A key upside: **restore is local**, so an already-signed-in user works offline; only first sign-in and account switching need Google reachable.

### D5 — The gate is a conditional render at the composition root; the URL is never touched

An identity context wraps the app. When no identity is present it renders the standalone **sign-in screen** (its own full-screen, token-themed, localized layout — *not* inside `AppShell`, so no authenticated chrome leaks); when an identity is present it renders `PreferencesProvider` → `AppShell` → `Routes` as today. Because the gate is a conditional render and **does not redirect**, the browser URL stays exactly as requested; when identity flips to present, React Router renders the current URL's view — so a signed-out visit to `/settings` lands on Settings, and `/nope` lands on the localized not-found, with no routing changes. This preserves the **entire location — path, query string, and hash fragment — for free**, since nothing serializes or replays a return URL; it is why the identity spec requires full-URL preservation rather than just the path. A future refactor to a `returnTo`-style redirect (should one ever be needed) would have to carry query and hash explicitly to keep meeting that requirement — the no-redirect gate simply avoids the footgun. The gate sits *above* routing, so it also short-circuits unknown paths while signed out (sign-in screen, URL intact). Sign-out is a shell button (explicit gesture) — no action URL, consistent with the routing change's action-URL policy.

The sign-in screen still needs i18n and theme before any account exists. `PreferencesProvider` is generalized to take `userId: string | null` and `accountLocale: string | null` from the identity context: with `userId === null` it resolves the **browser-locale cascade** and **does not persist** (Settings is unreachable while gated anyway), so the sign-in screen is fully localized/themed through the existing settings machinery — one i18n/theme path, no bootstrap fork.

**Alternative considered — an addressable `/sign-in` route (deferred, not rejected).** A dedicated `/sign-in` URL rendering the same screen (visited signed-out → sign in → land on `/`; visited signed-in → bounce to `/`) is a clean addition and could layer *on top of* the in-place gate later without removing it — the gate keeps deep links at their own URL; `/sign-in` just adds a linkable sign-in location. It is not needed now: Fin has **no signed-out content**, so the gate is already every URL's signed-out face, and nothing yet wants to *link to* sign-in specifically. It is deliberately deferred rather than a `returnTo`-redirect model (which would trade the free full-URL preservation above for encoding + open-redirect-guard + history-discipline machinery that has no current beneficiary). Revisit when a real trigger appears — a first public (signed-out) view, server-side rendering, or a redirect-based OAuth flow. Adding it stays localized (a route-table entry + a bounce guard, all layer 4), so deferring corners nothing.

### D6 — Preferences re-key on identity change; partitions need no migration

`PreferencesProvider` (`src/settings/PreferencesContext.tsx`) stops hardcoding `LOCAL_PLACEHOLDER_USER_ID`. It reads `userId` + `accountLocale` from `useIdentity()`; when `userId` changes (sign-in, switch, sign-out) it rebuilds `SettingsUseCase` for that id and reloads that user's overrides, and passes `accountLocale` into `resolvePreferences` — activating the dormant top cascade tier with **no change to the pure function**. Because IndexedDB stores are already keyed `[userId, key]`, switching accounts just changes which rows are read; nothing migrates and no cross-account leakage is possible. The existing load-in-flight, persistence-failure, and atomic-remove behaviors are unchanged — only the `userId`/`accountLocale` source moves.

### D7 — OAuth client id via build env; origins in Google Cloud; graceful misconfig

The OAuth **client id** comes from `import.meta.env.VITE_GOOGLE_CLIENT_ID`; authorized **JavaScript origins** (e.g. `http://localhost:5173` for dev) are configured on the Google Cloud OAuth client — **no redirect URIs, no client secret, no server**. The GIS client script loads from `https://accounts.google.com/gsi/client` (external origin — a hosting/CSP note: `script-src`/`connect-src`/`frame-src` must allow `accounts.google.com`; documented in the README, not assumed in app code). A missing/blank client id renders a **localized configuration notice** on the sign-in screen rather than crashing.

### D8 — Retire `LOCAL_PLACEHOLDER_USER_ID`; no placeholder migration

Since sign-in now precedes all per-user storage, nothing new is ever written under the placeholder. The constant is removed from production paths (kept only if a test needs a literal). Per plan, **no local-user migration exists**: any preferences a developer wrote under the placeholder during the foundation phase are throwaway dev state and are deliberately not migrated to a Google id.

**Corner test (plan-level engineering practice):** identity's entire footprint is the layer-4 adapter + two ports, the root-level gate, and the `userId`/`accountLocale` inputs into `PreferencesProvider`. Swapping the IdP, or replacing the local session with a Phase-X server-backed one, is a mechanical change across exactly those points — the `UserIdentity` entity, the use case, the gate's shape, and every layer-1–3 consumer of `userId` stay put. The pick is justified against Fin's eventual multi-user/server shape, not today's single developer.

### D9 — Security & privacy posture

**`userId = sub` is Google's endorsed key** (stable, opaque, never reused; email is mutable and reassignable, so it is display-only). The security-critical framing: in Phase 1 a `userId` is a **partition key, not an access-control boundary**.

- At **sign-in** the ID token is authentic — GIS obtains it directly from Google over HTTPS in its own popup/iframe. As **defense-in-depth**, the adapter still verifies the decoded token's `aud` (matches our client id), `iss` (Google), and `exp` before accepting it, rejecting anything else — cheap insurance against a token minted for another app being fed in.
- The soft spot is **persistence**: the decoded identity sits in `localStorage` and is not re-validated on reload, so anyone with browser access can forge a session. Accepted — Phase 1 is explicitly *not a security boundary* ("anyone with browser access can see the data"). The id is trusted to *organize* data, never to *protect* it.
- **Phase X** makes `userId` trustworthy: the server validates signature (Google JWKS), `iss`, `aud`, and `exp` before honoring a token. This slots in behind the same ports (D2/D4).

**Privacy posture is deliberately minimal:**

- `sub` is pseudonymous (opaque, not name/email) — the privacy-preferable key. Profile fields (name/email/picture/locale) are captured for display/defaults only.
- **Local-only in Phase 1:** all identity + profile data lives in the user's own browser, sent to no backend we operate (there is none) — no server-side collection, no third-party sharing, no cross-border transfer.
- **Least privilege:** only `openid`/`profile`/`email` + the `locale` claim; Drive is deferred to `(D)`.
- **Disclosure & deletion:** the sign-in screen carries a short localized privacy note (what we read from Google, that it stays on-device); sign-out clears the local session. Because storage is keyed by `userId` with tombstone-friendly deletes (per plan), erasing a user is "drop all rows for that `sub`" — which is what makes Phase X erasure/DSAR tractable. Configuring Google's OAuth consent screen (task 1.1) and complying with Google's API Services User Data Policy bind us now and tighten when `(D)` requests the sensitive Drive scope.

## Risks / Trade-offs

- **[GIS script is an external dependency; if `accounts.google.com` is blocked, first sign-in fails — and the whole app is gated behind it]** → restore is local (D4), so already-signed-in users keep working offline; only first sign-in / switching needs Google. First-sign-in failure renders a localized notice, not a crash. This is inherent to "sign-in required" and acceptable under the Phase-1 convenience posture.
- **[No server-side token validation; a tampered `localStorage` session could impersonate]** → accepted and explicit: Phase 1 is *not a security boundary* ("anyone with browser access can see the data"); a real boundary arrives with the Phase-X server, which slots in behind the same `IdentityProvider`/`SessionStore` ports.
- **[The `locale` claim is not guaranteed on every account]** → the cascade already falls through to browser locale then fallback (specced); account locale is a *preferred* default tier, not a required one.
- **[jsdom cannot run the GIS popup]** → the use case and gate are tested against the mocked `IdentityProvider`; the real popup, session-restore-on-reload, and account switching are in the change's manual verification step per AGENTS.md.
- **[One Tap / auto-select could silently pick an account, undermining deliberate switching]** → `auto_select: false`; sign-in is always an explicit button gesture.
- **[New build-time config (`VITE_GOOGLE_CLIENT_ID`) and a Google Cloud OAuth client are prerequisites to run the app]** → documented in the README with the exact origins to whitelist; a missing id degrades to a localized configuration notice rather than a blank screen.

## Migration Plan

- **Data:** none. No placeholder-to-Google migration exists by design (D8); pre-existing placeholder preferences are throwaway dev state.
- **Deploy prerequisites:** create a Google Cloud OAuth client (Web), add the app's JavaScript origins (localhost for dev; real origins when a host is chosen), no redirect URIs; set `VITE_GOOGLE_CLIENT_ID` in the build env.
- **Rollback:** revert the change; the app returns to the placeholder-id, no-gate behavior. No stored data shape changes, so rollback is clean.

## Open Questions

- Whether to also enable Google **One Tap** on the sign-in screen (in addition to the button) — deferred as an optional UX enhancement; the button alone satisfies the requirements.
- Exact placement/affordance of the account control in `AppShell` (menu vs inline) across phone/tablet/desktop — settled during implementation against the responsive shell; the spec only requires that the account is shown and sign-out is reachable.

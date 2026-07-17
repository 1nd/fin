## Why

The shell's navigation is in-memory React state: the URL never changes, browser back leaves the app, and refresh always lands on Home. The plan establishes URL addressability as a cross-cutting obligation from `(H) url-routing` onward, and `(B) google-signin` needs the final navigation model in place so its sign-in gate can preserve the intended destination — routing is cheapest now, while the app is two static views.

## What Changes

- Replace the in-memory navigation seam (`useShellNavigation`) with history-API URL routing: existing views become addressable at `/` (Home) and `/settings` (Settings).
- Shell navigation goes through the router, so activating a nav entry updates the URL, browser back/forward navigates within the app, and refresh restores the current view.
- Unknown paths render a localized not-found view inside the shell with a way back to Home (no silent redirect).
- Router library pick, base-path handling, and the action-URL safety policy (URLs that perform a side effect on visit must guard against prerender) are decided in this change's `design.md`; the policy's durable, discoverable home is `plan.md` ("URLs & navigation"), with the enforceable requirement in the `url-routing` spec.
- No visual or behavioral change to the views themselves; Home and Settings render as before.

## Capabilities

### New Capabilities

- `url-routing`: URL addressability of app views — history-API paths, browser back/forward navigation within the app, refresh restoring the current view, unknown-path handling, and the selective-addressability discipline for future changes.

### Modified Capabilities

None — `app-shell`'s navigation requirement ("activating Settings displays the Settings page") still holds as written; the URL-level behavior is new requirements under `url-routing`

## Impact

- **Code:** `src/app/App.tsx` (view switching becomes route rendering), `src/shell/useShellNavigation.ts` (replaced by router-backed navigation), `src/shell/AppShell.tsx` (nav entries become router links), new not-found view, i18n catalogs (en/id) gain not-found strings.
- **Dependencies:** one new runtime dependency — the router library chosen in `design.md`.
- **Systems:** dev server already serves SPA fallback (Vite); while the build output happens to be a static SPA (a fact, not a commitment — per `plan.md`), static hosts must serve the app for unknown paths ("SPA fallback") — a documented hosting note, not an app-code assumption. No storage, i18n-mechanism, or theming changes.

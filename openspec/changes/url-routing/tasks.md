## 1. Router foundation

- [x] 1.1 Add `react-router` (v7) as a runtime dependency
- [x] 1.2 Create the layer-4 route table module (`src/shell/routes.ts`): path constants for Home (`/`) and Settings (`/settings`) plus the catch-all, as the single source of path strings
- [x] 1.3 Wrap the app in `<BrowserRouter basename={import.meta.env.BASE_URL}>` at the composition root (`src/app/main.tsx`)

## 2. Route-driven shell

- [x] 2.1 Replace view switching in `src/app/App.tsx` with `Routes`/`Route` rendering Home, Settings, and the not-found view from the route table
- [x] 2.2 Convert `AppShell` nav entries from buttons to `NavLink`s reading paths from the route table, with active state (`aria-current`) derived from the URL and existing token-based styling preserved
- [x] 2.3 Delete `src/shell/useShellNavigation.ts` and remove the `ShellView` state plumbing from `App`/`AppShell`

## 3. Not-found view

- [x] 3.1 Create the not-found view rendered inside the shell for unmatched paths: keeps the requested URL (no redirect), offers a link back to Home
- [x] 3.2 Add not-found strings to the English and Indonesian catalogs (`src/i18n/resources/en.json`, `id.json`); no hardcoded user-facing text

## 4. Tests

- [x] 4.1 Update `src/app/App.test.tsx` to render under `MemoryRouter`, covering: direct entry at `/settings` renders Settings; nav click renders Settings and marks it current; unknown path renders localized not-found
- [x] 4.2 Add a history navigation test: navigate Home → Settings, go back → Home renders, forward → Settings renders (MemoryRouter/jsdom history)
- [x] 4.3 Run `npm run test` and `npm run typecheck`; all green

## 5. Documentation & verification

- [x] 5.1 Add a README hosting note: while the build output is a static SPA, static hosts must serve the app for unknown paths (SPA fallback) for history-API URLs to work; hash mode exists as a config-level fallback
- [x] 5.2 Manual verification in a real browser (per AGENTS.md): visit `/` and `/settings` directly, refresh on `/settings` restores it, back/forward traverse views without leaving the app, URL bar shows clean paths, unknown path shows localized not-found in both languages, nav links open in new tab correctly

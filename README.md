# Fin

Fin is a purpose-built personal finance app that replaces ad-hoc spreadsheet
tracking. It tracks **net worth** (assets/liabilities) and **budgeting**
(income/expenses) with built-in history, arbitrary-depth categorization, and
multi-currency support.

Where spreadsheets store _states_ (and trends require duplicating rows per
month), Fin stores **dated facts** — balance snapshots, transactions, exchange
rates — and derives any state as a pure function of them. See
[openspec/plan.md](openspec/plan.md) for the full product and architecture
plan.

## Status

Phase 1 (web + local storage) is under active development. Planning and
change tracking live under [openspec/](openspec/).

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (strict), built with [Vite](https://vite.dev/)
- [Vitest](https://vitest.dev/) + Testing Library for tests
- ESLint (typescript-eslint strict) + Prettier, enforced on pre-commit via husky + lint-staged
- IndexedDB for Phase 1 persistence

## Getting started

Requires Node listed in [.nvmrc](.nvmrc) (`nvm use`).

```sh
npm install
npm run dev       # start the dev server
```

Signing in requires a Google OAuth client id — see "Google Sign-In setup" below.

## Google Sign-In setup

The app requires a Google identity before rendering any view (see
[openspec/changes/google-signin](openspec/changes/google-signin)). Authentication runs
entirely in the browser via Google Identity Services (GIS) — an ID-token popup flow with
no redirect URIs, no client secret, and no server.

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an
   OAuth **client id** of type **Web application**.
2. Add this app's **Authorized JavaScript origins** (e.g. `http://localhost:5173` for the
   Vite dev server). Leave **Authorized redirect URIs** empty — none are used.
3. Copy [.env.example](.env.example) to `.env` and set `VITE_GOOGLE_CLIENT_ID` to the
   client id from step 1. `.env` is gitignored; never commit a real client id.
4. Restart `npm run dev` so Vite picks up the new env var.

Without `VITE_GOOGLE_CLIENT_ID` set, the sign-in screen shows a localized configuration
notice instead of crashing.

The GIS client script loads from `https://accounts.google.com/gsi/client`. A host with a
Content-Security-Policy must allow this origin in `script-src`, `connect-src`, and
`frame-src` for sign-in to work.

## Scripts

| Command                | What it does                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Start the Vite dev server          |
| `npm run build`        | Typecheck and build for production |
| `npm run preview`      | Preview the production build       |
| `npm test`             | Run the test suite (Vitest)        |
| `npm run lint`         | Lint with ESLint                   |
| `npm run typecheck`    | Typecheck with tsc                 |
| `npm run format`       | Format with Prettier               |
| `npm run format:check` | Check formatting                   |

## Hosting

App views are addressable at clean, history-API paths (e.g. `/settings`), not
hash fragments. While Phase 1's build output happens to be a static SPA, a
static host must serve the app for unknown paths ("SPA fallback") so that
direct visits and refreshes on these paths work; hash-based routing remains
available as a config-level fallback if a host cannot provide this. This note
lapses for a server-backed Fin, which would serve these routes itself.

## Architecture

Fin follows Clean Code Architecture: a pure TypeScript domain core with
storage, identity, and UI as swappable adapters. Every source file declares
its layer with a `// CCA: <n>` tag on line 1, and imports must point inward
(lower layers never import from higher ones). Directories are organized by
feature/ownership, not by layer. Conventions are detailed in
[AGENTS.md](AGENTS.md).

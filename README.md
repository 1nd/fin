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

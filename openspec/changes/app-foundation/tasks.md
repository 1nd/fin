# Tasks: app-foundation

## 1. Scaffolding & tooling

- [x] 1.1 Add `.nvmrc` (current Node LTS) and scaffold a Vite + React 19 + TypeScript app in the repo root (strict tsconfig), verifying `npm run dev` serves the default page
- [x] 1.2 Configure ESLint (flat config, typescript-eslint strict) and Prettier, with husky + lint-staged running both on pre-commit per AGENTS.md
- [x] 1.3 Add Vitest (+ Testing Library, fake-indexeddb) with a trivial passing test wired into `npm test`
- [x] 1.4 Create the feature-first source layout (`src/app/`, `src/shell/`, `src/settings/`, `src/storage/`, `src/i18n/`, `src/theme/`), move the Vite entry files under `src/app/`, and tag every source file `// CCA: <n>` on line 1 per its role
- [x] 1.5 Push to GitHub (done manually by the user; agent stops here and hands off)
- [x] 1.6 Add a GitHub Actions workflow running install → lint → typecheck → test → build on every push, with all third-party actions (e.g. `actions/checkout`, `actions/setup-node`) pinned to full commit SHAs (version noted in a trailing comment); add `dependabot.yml` for the `github-actions` ecosystem so pinned SHAs get version-bump PRs; confirm the workflow passes

## 2. Foundations: tokens, i18n, storage

- [x] 2.1 Create `tokens.css` defining the semantic token set and dark theme values (scoped by `data-theme="dark"`); wire it into the app root
- [x] 2.2 Set up i18next + react-i18next with `en.json` and `id.json` catalogs and a helper so components only ever call `t()`
- [x] 2.3 Define the storage record conventions (record `{ id, userId, ...payload, updatedAt, deletedAt? }`, placeholder `userId` constant `"local-placeholder"`) and the layer-2 `SettingsRepository` port
- [x] 2.4 Implement the IndexedDB adapter with `idb` (settings store keyPath `[userId, key]`, tombstone deletes) plus adapter tests on fake-indexeddb
- [x] 2.5 Request `navigator.storage.persist()` at startup, logging the outcome without blocking

## 3. Preference domain (entities + use cases)

- [x] 3.1 Implement entity-layer preference model: preference types/values (language en/id, separator styles, three date formats, theme dark) and the locale→defaults mapping, with unit tests
- [x] 3.2 Implement the pure cascade `resolvePreferences(accountLocale, browserLocale, overrides)` with built-in fallback, covering override-beats-cascade, unrecognized locale, and null `accountLocale` in unit tests
- [x] 3.3 Implement pure number and date formatters driven by preference (not language), 24-hour time only, with unit tests
- [x] 3.4 Implement the layer-2 Settings use case (load overrides via the port, compute effective prefs, save an override) tested against an in-memory repository

## 4. Shell & Settings UI

- [x] 4.1 Build the responsive app shell: navigation frame + placeholder landing page, styled only via tokens, laying out correctly at phone/tablet/desktop widths; establish the thin-component pattern (presentational components, behavior in pure functions and DOM-free hooks) per design D1. Delete the Vite scaffold placeholders — `src/app/index.css`, `src/app/App.css`, and the demo `App.tsx` content plus its assets — rather than migrating them; no new file may reference the Vite `--text`/`--accent` variable set (only `tokens.css` tokens)
- [x] 4.2 Add the preferences React context/provider that computes effective prefs at startup and applies them (i18next language, `data-theme`, formatters), re-rendering on change
- [x] 4.3 Build the Settings page: show effective values for language, number format, date format, theme; changing one persists the override and applies immediately, leaving the others untouched
- [x] 4.4 Fill both catalogs so every shell/Settings string is localized (no hardcoded user-facing strings), and add a UI smoke test: shell renders, switching language flips a visible string

## 5. Verification

- [x] 5.1 Run the full CI suite locally (lint, typecheck, tests, build) and confirm the GitHub Actions run is green
- [x] 5.2 Manual verification per `plan.md`: open the app locally — responsive dark shell at phone/tablet/desktop widths; in Settings switch language to Indonesian, change number and date formats; reload and confirm all preferences are retained and applied
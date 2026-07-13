## 1. Project Setup

- [x] 1.1 Initialize Expo (React Native + react-native-web) project targeting the web build
- [x] 1.2 Configure linting, formatting, and TypeScript
- [x] 1.3 Establish the `src/` directory skeleton and layering (app/domain/data/features/ui/theme/i18n) per design Decision 10
- [x] 1.4 Set up the test runner and an `npm test` script: single Jest runner via jest-expo + @testing-library/react-native (design Decision 11)
- [x] 1.5 Add a pre-commit hook via husky + lint-staged that runs Prettier and ESLint (with `--fix`) on staged files only — no typecheck or tests in the hook (those stay in manual scripts/CI)
- [x] 1.6 Add GitHub Actions CI workflow running lint, Prettier check, typecheck, and tests on PRs and pushes to `main`; enable branch protection requiring it to pass before merge (design Decision 13)
- [ ] 1.7 Create the expo-router route skeleton (`src/app/`): minimal root `_layout` (no providers yet) and placeholder routes for Sign-in, Dashboard, Categories, Entries, Reports, and Settings — from this point the app runs at localhost (`npm run web`) and every later UI task replaces its placeholder and is manually verifiable in the browser
- [ ] 1.8 Configure app icons/branding placeholders and basic app shell

## 2. Data Storage Layer

- [ ] 2.1 Define repository interfaces (`CategoryRepository`, `EntryRepository`) independent of any storage engine
- [ ] 2.2 Implement IndexedDB-backed repository implementations for web
- [ ] 2.3 Implement user-scoping (all reads/writes filtered/tagged by current `userId`)
- [ ] 2.4 Wire repositories into app via dependency injection/context so calling code never references IndexedDB directly
- [ ] 2.5 Test IndexedDB repositories against an in-memory IndexedDB (e.g. `fake-indexeddb`): CRUD round-trips and `userId` scoping isolation between two users
- [ ] 2.6 Test the aggregate `DataRepository` (`hasAnyDataForUser`, full-replace `replaceAllForUser`) and `SettingsRepository`, including that restoring one user's data leaves another user's records intact
- [ ] 2.7 Implement a resilient DB connection provider (retry after a failed open; reopen after mid-session connection loss or a cross-tab schema upgrade) and test it against `fake-indexeddb` — satisfies the `data-storage` "Storage access retries after a transient failure" requirement
- [ ] 2.8 Mount the repository provider (from 2.4) in the app shell root `_layout`

## 3. Theming

- [ ] 3.1 Define design tokens (color, spacing, typography) and theme provider/context
- [ ] 3.2 Implement Dark theme token set as the default and only registered theme
- [ ] 3.3 Build UI components to consume values exclusively from the theme provider (no hard-coded style values)
- [ ] 3.4 Unit-test theme token completeness: every registered theme exposes the identical token key set (analogous to the i18n key-parity test in 4.7; guards against a future second theme missing tokens)
- [ ] 3.5 Mount the theme provider in the app shell root `_layout` so all routes render themed

## 4. Localization

- [ ] 4.1 Set up i18n library and English + Indonesian translation resources
- [ ] 4.2 Implement Indonesian and English/US number formatting (thousands/decimal separators, digit grouping) as an independent preference from language
- [ ] 4.3 Implement date format selection limited to exactly three options (`YYYY-MM-DD`, `DD-MM-YYYY`, `MM-DD-YYYY`), independent of language and number format; render all times in fixed 24-hour format (no 12-hour option)
- [ ] 4.4 Implement shared preference-resolution logic (explicit setting → Google account locale → browser locale), applied independently to each of language, number format, and date format
- [ ] 4.5 Build Settings/Account page controls for language, number format, and date format as three separate selectors, each persisting its own override independently
- [ ] 4.6 Unit-test locale preference resolution (Google account locale → browser locale → hardcoded default, each preference independent) and number/date formatting
- [ ] 4.7 Unit-test i18n invariants: en/id resource files expose identical key sets, and `getI18nInstance` returns a synchronously initialized instance (guards the inline-resources assumption)
- [ ] 4.8 Add a render smoke test asserting translated text (not raw i18n keys) appears in both languages
- [ ] 4.9 Mount the i18n provider in the app shell root `_layout`

## 5. Auth

- [ ] 5.1 Integrate Google Sign-In (client-side OAuth/Identity Services flow), including the incremental `drive.file` scope needed for backup
- [ ] 5.2 Derive and persist a stable `userId` from the authenticated Google account
- [ ] 5.3 Implement local session handling (sign-in restores session on reload, sign-out ends session without deleting data)
- [ ] 5.4 Build sign-in/sign-out UI, including messaging that Phase 1 data is local to the browser
- [ ] 5.5 Mount the auth provider in the root `_layout`, wire `SignInScreen` into the Sign-in route, and gate authenticated routes (redirect to Sign-in when no session; redirect away from Sign-in when a session exists)
- [ ] 5.6 Wire the Google OAuth client ID via `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (add `.env.example` and a README note covering the Google Cloud Console setup with `http://localhost:8081` as authorized origin) so real sign-in works locally
- [ ] 5.7 Verify manually at localhost: sign-in completes, session restores on reload, sign-out ends the session

## 6. Category Model

- [ ] 6.1 Define `Category` schema (id, name, parentId, entityType) and persistence via the repository layer
- [ ] 6.2 Implement category CRUD (create, rename, delete, reparent) with arbitrary depth
- [ ] 6.3 Implement rollup aggregation (own entries + recursive descendant entries) via in-memory tree walk
- [ ] 6.4 Implement deletion reassignment: entries/children move to parent; fallback to entity type's "Uncategorized" category when no parent exists
- [ ] 6.5 Create system "Uncategorized" category per entity type, protected from deletion
- [ ] 6.6 Define and seed recommended starter category trees (2-3 levels) per entity type on first sign-in
- [ ] 6.7 Build category management UI (tree view, create/rename/delete/reparent, entity type scoping)
- [ ] 6.8 Parameterize rollup's entry valuation (`valueOf` callback on `computeCategoryRollups`) so the tree walk in `domain/rollup.ts` stays purely structural, with base-currency valuation supplied by callers (design Decision 10)
- [ ] 6.9 Unit-test category-tree operations, rollup aggregation, and deletion reassignment in `domain/` (the "most worth unit-testing" logic per design Decision 10)
- [ ] 6.10 Wire `CategoryScreen` into the Categories route and verify category management manually at localhost

## 7. Financial Entries

- [ ] 7.1 Define `Entry` schema (categoryId, amount, currency, fxRateToBase, date, note for income/expense) and persistence via the repository layer
- [ ] 7.2 Implement append-only snapshot entries for asset/liability categories (no overwrite/edit-in-place of prior snapshots)
- [ ] 7.3 Implement transaction entries for income/expense categories, supporting both single aggregated and itemized entry patterns
- [ ] 7.4 Implement entity-type validation (entry's category must match asset/liability vs income/expense)
- [ ] 7.5 Implement multi-currency entry input with required manual exchange rate when currency differs from base currency
- [ ] 7.6 Build entry entry/edit UI for assets, liabilities, income, and expenses, wired into the Entries route and verified manually at localhost
- [ ] 7.7 Build base currency confirmation prompt shown when saving the first entry (default suggested from locale, explicit confirm/override required, states permanence)
- [ ] 7.8 Block first-entry save until base currency is confirmed; finalize as read-only once confirmed
- [ ] 7.9 Unit-test FX conversion (`domain/fx`) and entity-type validation logic

## 8. Reporting

- [ ] 8.1 Implement net worth computation (assets − liabilities, converted to base currency via stored entry FX rates) across historical snapshot dates
- [ ] 8.2 Build net worth over time chart
- [ ] 8.3 Implement category breakdown computation (using rollup aggregation) for a selected entity type and period
- [ ] 8.4 Build category breakdown chart/view, wired into the Reports route and verified manually at localhost
- [ ] 8.5 (Nice-to-have) Implement income vs. expense trend computation and chart
- [ ] 8.6 Unit-test net worth computation (`domain/net-worth`) across historical snapshot dates, including multi-currency conversion via stored FX rates

## 9. Drive Backup & Restore

- [ ] 9.1 Implement Drive API client for creating/updating a single app-owned file (`drive.file` scope)
- [ ] 9.2 Define backup serialization format for a user's categories and entries
- [ ] 9.3 Implement debounced backup-after-write-activity trigger (fires ~1-2 min after the last change, while app is open), tracking last-successful-backup timestamp and whether changes are pending locally
- [ ] 9.4 Implement backup-on-sign-out trigger, skipping it if no changes are pending since the last successful backup
- [ ] 9.5 Implement non-blocking failure handling so a failed backup never interrupts normal app use
- [ ] 9.6 Implement backup status display (last attempt timestamp + success/failure) in Settings
- [ ] 9.7 Implement restore: detect existing Drive backup and offer restore on sign-in when no local data exists
- [ ] 9.8 Implement manual restore action in Settings, with confirmation when local data already exists
- [ ] 9.9 Implement restore-as-full-replace (load backup contents into IndexedDB, discarding any differing local data)

## 10. Settings

- [ ] 10.1 Build Settings/Account page shell, wired into the Settings route and verified manually at localhost
- [ ] 10.2 Surface the finalized base/reporting currency as a read-only value in Settings (from Task 7.8); if not yet finalized, indicate it will be chosen at the first entry
- [ ] 10.3 Surface language, number format, and date format selectors (from Task 4.5), sign-out (from Task 5.4), and backup status/manual restore (from Tasks 9.6, 9.8) in Settings

## 11. QA and Polish

- [ ] 11.1 Verify empty/first-run states (no categories, no entries, seeded starter categories visible)
- [ ] 11.2 Verify deletion/reassignment and reparenting behavior against the `categories` spec scenarios
- [ ] 11.3 Verify multi-currency entry and net worth conversion against the `financial-entries` and `reporting` spec scenarios
- [ ] 11.4 Cross-browser check for IndexedDB behavior (storage limits, persistence across reloads)
- [ ] 11.5 Accessibility pass on Dark theme (contrast, readability) as a baseline before future themes are added
- [ ] 11.6 Verify backup/restore behavior against the `drive-backup` spec scenarios, including a fresh-browser restore and a manual restore with existing local data
- [ ] 11.7 Verify base currency confirmation flow: prompted on first entry, entry blocked until confirmed, default suggestion overridable, permanently fixed and read-only afterward

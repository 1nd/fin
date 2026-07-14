## Why

Financial life is currently tracked ad hoc in spreadsheets (Google Sheets), which requires manually duplicating rows to see trends over time and offers no structure for growing category detail or multi-currency holdings. Fin replaces this with a purpose-built app that tracks net worth (assets/liabilities) and budgeting (income/expenses) with built-in history, arbitrary-depth categorization, and multi-currency support — while being architected from day one to grow into a multi-user, cross-platform (web/iOS/Android) product without a rewrite.

## What Changes

- Introduce Fin as a new web app (React Native + Expo, targeting web first) for tracking personal financial assets, liabilities, income, and expenses.
- Add "Sign in with Google" authentication as a convenience login (not a security boundary in Phase 1), used to derive a stable `userId` that keys all locally-stored records.
- Add a client-side data storage layer backed by IndexedDB, accessed through a platform-aware repository abstraction so native storage engines (e.g. SQLite) can be substituted later without touching the rest of the app.
- Add a unified `Category` model: a self-referencing, arbitrary-depth tree scoped per entity type (asset, liability, income, expense), supporting full custom user-defined categories seeded with recommended starting sets, with defined lifecycle rules for deletion and reparenting.
- Add a unified `Entry` model: append-only, timestamped records attached to any category node — balance snapshots for assets/liabilities, transactions for income/expenses — both supporting multi-currency amounts with a manually-entered, time-locked exchange rate.
- Add reporting views: net worth over time and category breakdown (must-have); income vs. expense trend (nice-to-have).
- Add an extensible theming architecture shipping with a Dark theme only; no theme switcher UI yet since there is only one theme.
- Add a responsive UI foundation: a navigation shell that adapts between phone browser widths (bottom tabs) and desktop browser widths (sidebar + centered content column), a small set of shared interaction components (input, icon button, list item, confirm dialog, empty/loading/error states), and app-wide interaction conventions (destructive actions confirm; data screens show loading/empty/error states; errors are human-readable and localized). Explicitly not a visual identity/branding pass, which remains deferred.
- Add internationalization support for English and Indonesian, with `id-ID` locale formatting, defaulting from the user's Google account locale or browser locale, overridable in Settings.
- Add automatic backup of local data to the user's Google Drive (via the Drive API, using an incremental OAuth scope granted during Google Sign-In), plus restore, to protect against data loss if the browser's local storage is cleared or the device is lost.

## Capabilities

### New Capabilities

- `auth`: Google Sign-In flow, session handling, and derivation of a stable per-user identifier used to key locally stored data.
- `data-storage`: Platform-aware repository abstraction over IndexedDB (web) that all other capabilities persist through; designed so native storage engines can be substituted later.
- `categories`: Self-referencing, arbitrary-depth, per-entity-type category tree with custom user-defined categories, recommended starter sets, rollup semantics, and deletion/reparenting lifecycle rules.
- `financial-entries`: Append-only snapshot (assets/liabilities) and transaction (income/expenses) records attached to categories, with multi-currency amounts and manually-entered, time-locked exchange rates.
- `reporting`: Net worth over time and category breakdown visualizations (must-have), income vs. expense trend (nice-to-have).
- `theming`: Extensible design-token/theme-provider architecture shipping with a single Dark theme.
- `ui-foundation`: Responsive app shell (adaptive navigation, content layout) and app-wide interaction conventions (confirmation for destructive actions, loading/empty/error states, human-readable localized errors) that all screens build on.
- `localization`: English/Indonesian language support with `id-ID` locale-aware number, date, and currency formatting, and language preference resolution/override.
- `drive-backup`: Automatic, activity-triggered backup of local data to the user's Google Drive (shortly after changes settle, plus on sign-out), with restore (manual, and offered automatically on sign-in when no local data is present).

### Modified Capabilities

- None — this is a greenfield product with no existing specs.

## Impact

- New Expo (React Native + react-native-web) project targeting web as the initial build output.
- New client-side-only architecture: no backend/server in Phase 1; all data lives in the browser's IndexedDB, keyed by the Google-derived `userId`. IndexedDB remains the source of truth for reads/writes; Drive is a backup destination only, not a sync layer.
- Google Sign-In now requests an additional Drive scope (`drive.file`) so the app can create and update a backup file in the user's Drive.
- Establishes foundational data models (`Category`, `Entry`) and abstractions (repository interface, theme provider, i18n resolution) that later phases (multi-user backend, native builds, additional themes, live FX rates, external ledger import) will extend rather than replace.

## Context

Fin replaces an ad hoc Google Sheets workflow for tracking net worth (assets/liabilities) and budgeting (income/expenses). Phase 1 has exactly one real user (the owner) and no backend — everything runs in the browser. However, the product is explicitly intended to grow into a multi-user, cross-platform (web + iOS + Android) product in later phases, so Phase 1's architecture is chosen to avoid rework at that transition, even though the extra structure isn't strictly needed for a single user today.

## Goals / Non-Goals

**Goals:**

- Ship a usable web app to track assets, liabilities, income, and expenses, with trend history and category breakdowns.
- Choose a framework, storage pattern, and data model that extend cleanly to multi-user + native mobile without a rewrite.
- Ensure data isolation, session handling, and UI state are correctly multi-user-safe from day one — distinct accounts signing in on the same browser must never see each other's data, even though Phase 1 has only one real user (the owner) in practice.
- Support multi-currency entries with manual FX rates: any entry can be recorded in whatever currency the transaction actually used, and a base/reporting currency that is a per-user setting the user explicitly confirms at their first entry (not hardcoded), so adoption by users outside Indonesia doesn't require rework.
- Support arbitrarily deep, user-defined categorization shared across all four financial areas.
- Protect the user's data against loss from cleared browser storage or a lost/replaced device, via automatic backup to Google Drive and restore.

**Non-Goals (Phase 1):**

- No backend server or database — no cross-device sync, and no server-side verification of user identity (there is no backend to check token authenticity, so client-side `userId` scoping is correct but not cryptographically enforced against a malicious client). Per-user data isolation itself is in scope (see Decision 3, Decision 6, and the `auth`/`data-storage` specs) — this Non-Goal is narrower than "no isolation."
- No live FX rate fetching.
- No import from external ledgers (bank apps, GoPay, etc.).
- No native iOS/Android builds — web (Expo web) only.
- No themes beyond Dark, no in-app theme switcher.
- No point-in-time-accurate historical category structure (see Decision: Category mutability).
- No retained history of multiple backup versions — the Drive backup file is overwritten on each run (see Decision 9); Drive's own revision history is the only fallback if a bad backup overwrites a good one.
- Drive backup is not a sync mechanism between multiple devices/browsers — IndexedDB remains the sole source of truth for reads/writes; Drive is a one-way backup destination and a restore source, not a live sync target.
- No ability to change the base/reporting currency once the first entry has been recorded (see Decision 5) — it's locked at that point. A separate, purely cosmetic "view this report in a different currency" display layer (converting an already-computed total using today's rate, without touching stored data or the locked base currency) is a clean future extension but is not built in Phase 1.

## Decisions

### 1. Framework: React Native + Expo (web target first)

Chosen over (a) a plain web framework (React/Vue/Svelte) wrapped later with Capacitor, and (b) Flutter. Expo gives a single codebase that already targets web, iOS, and Android, so Phase 1 code is not a throwaway prototype — the same components/screens extend to native builds in a later phase via `expo run:ios` / `expo run:android`, without a rewrite or a second UI implementation. The trade-off is slightly more setup overhead now (Expo project structure, react-native-web quirks) versus a plain React app, which is acceptable given the stated goal of avoiding a future rewrite.

### 2. Storage: IndexedDB behind a platform-aware repository interface

Phase 1 runs only on web, where IndexedDB is the appropriate structured, higher-capacity alternative to `localStorage` (which is synchronous, string-only, and capped around 5-10MB). Critically, IndexedDB is a browser-only API and does not exist in the React Native native runtime — so all reads/writes go through a repository interface (e.g. `CategoryRepository`, `EntryRepository`) with an IndexedDB implementation for web. When native builds are added later, a SQLite- or MMKV-backed implementation of the same interface is substituted per platform; no calling code changes.

Alternative considered: a single storage abstraction with one implementation that "happens to be IndexedDB everywhere" was rejected because IndexedDB literally isn't available on native — the platform split is not optional.

### 3. Data model: unified `Category` (tree) + `Entry`, not four separate entity types

Assets, liabilities, income, and expenses all reduce to two structures:

- **Category**: self-referencing tree — `{ id, name, parentId, entityType }` where `entityType ∈ {asset, liability, income, expense}`. A category can be arbitrarily deep, and unlike a typical two-level category/subcategory design, there is no depth limit — a leaf like `Cash & Bank > Bank > BCA Savings` is exactly as valid as a shallow one like `Food`.
- **Entry**: an append-only, timestamped record attached to a `categoryId` at any depth (not necessarily a leaf).
  - Asset/liability entries are **balance snapshots**: `{ categoryId, amount, currency, fxRateToBase, date }`.
  - Income/expense entries are **transactions**: `{ categoryId, amount, currency, fxRateToBase, date, note }`.

This deliberately merges what might otherwise be modeled as a separate "Account/Item" entity into `Category` itself: a named, balance-bearing thing like "BCA Savings" is just a category node that happens to have entries attached directly to it, rather than a distinct entity type referencing a category. This was a direct simplification made during design review — an earlier draft proposed a separate `Item`/`Account` entity per asset/liability, but it was redundant once arbitrary-depth categories were already required (the same mechanism the user already uses mentally — e.g. filing "Starbucks" as a subcategory of "Food" — naturally extends to naming a specific bank account as a subcategory of "Bank").

**Rollup semantics**: a category's reporting value (e.g. for "net worth by category") is its own directly-attached entries plus the rolled-up value of every descendant category, computed recursively. IndexedDB has no server-side recursive query (no `WITH RECURSIVE` equivalent), so rollups are computed in application code — either by walking the in-memory category tree at read time (simplest; acceptable at Phase 1 data volumes) or by maintaining a materialized ancestor path per category if tree walks become a measurable bottleneck. Phase 1 implementation should start with the simple in-memory walk and only add materialized paths if profiling shows it's needed.

### 4. Category mutability: the tree reflects current structure, not point-in-time history

Reparenting a category (e.g. moving "Coffee" from under "Eating Out" to directly under "Food") is a simple `parentId` update, and intentionally changes historical rollups retroactively — a past month's "Eating Out" total will shrink if a subcategory is later moved out from under it. This was a deliberate choice: the category tree always represents the user's _current_ mental model of their finances, not a historically accurate snapshot of what the tree looked like on each past date. This is asymmetric with `Entry` records, which are immutable/append-only and preserve exactly what was true (amount, currency, FX rate) at the time they were created.

**Category deletion**: deleting a category auto-reassigns its direct entries and any child categories up to its parent category. If no valid parent exists (i.e. deleting a root-level category), entries/children fall back to a per-`entityType` system "Uncategorized" category, which always exists and cannot itself be deleted. "Uncategorized" is a real category internally (so entries and rollups work through the same mechanism as any other category), but it is not treated as one from the user's perspective: it's excluded from the category management UI entirely and is never offered as a choice when recording an entry, since it represents the _absence_ of a chosen category rather than a category the user manages. Its entries still remain visible and included in reporting (e.g. the category breakdown) whenever it's non-empty — hiding the bucket itself from management doesn't mean hiding the money in it.

**Starter categories**: a recommended category tree (2-3 levels deep, per `entityType`) is seeded on first use per user, using typical categories (Food, Transport, Housing, Salary, Investments, etc.). These are ordinary user-owned categories after seeding — fully editable, deletable, and reparentable, not an enforced taxonomy.

### 5. Multi-currency: manual FX rate, locked at entry time; base currency is a per-user setting, locked once the first entry exists

Each `Entry` carries its original `currency` and an `fxRateToBase` captured at creation time, converting to a base/reporting currency for aggregate views (net worth totals, category breakdowns). Rates are entered manually by the user in Phase 1 — no live FX API call. Because the rate is stored on the entry itself rather than recomputed at read time, historical entries remain accurate to what the user recorded even if they later learn the "true" historical rate was different, and aggregate reports don't shift retroactively when today's rate changes. A future phase can add live rate lookup as a convenience at entry-creation time without changing the stored-rate-per-entry model.

**Base currency is a per-user setting, not hardcoded — and it's finalized through an explicit confirmation step at the moment the user saves their first entry, not an implicit Settings value that quietly locks later.** When a user attempts to save their very first entry (of any type), the system presents a dedicated confirmation prompt — "This will be your permanent base/reporting currency and cannot be changed later" — suggesting a default using the same fallback-chain pattern as the other locale-driven preferences (Decision 8): the user's Google account locale if determinable, otherwise the browser locale if determinable, otherwise IDR as the fixed final default. The user must actively confirm (or pick something else) before the entry is saved. This is deliberately not a Settings field the user might casually edit early on and forget about: tying the decision to the first-entry moment, with explicit language about permanence, means the user always makes this choice knowingly. Once confirmed, Settings shows the base currency as a read-only, finalized value — unlike language/number format/date format, which stay freely changeable afterward (Decision 8), currency is a one-time decision precisely because changing it later isn't reconcilable without the reconciliation machinery discussed below. This was chosen specifically so that Fin adopting users outside Indonesia later is a matter of that user making their own informed choice at their own first entry — not a code change or migration — while every report stays fully accurate and continuous forever, with no reconciliation logic ever needed.

The key realization driving this: **entry currency already solves "record transactions in whatever currency I'm actually using."** Every entry can be in any currency regardless of the base currency (e.g. an IDR meal, a USD stock purchase, and — after relocating — a JPY meal, all coexist fine). Relocating to a different country is fully handled at the entry level and never requires touching the base currency at all. The base currency's only job is to be the one fixed denominator every entry converts into for reporting, so locking it removes an entire class of complexity (reconciling historical entries against a changed base, and the resulting report inconsistency) in exchange for a capability — mid-history currency changes — that the actual use cases don't need. A later, purely cosmetic "view this report in a different currency" display layer (re-expressing an already-computed base-currency total using today's rate, without touching stored data) remains a clean option if that convenience is ever wanted — it doesn't require any historical reconciliation because it never touches the underlying, still-locked base currency.

### 6. Auth: Google Sign-In as identity, not as a security boundary

Google Sign-In (via a client-side OAuth/Identity Services flow — no backend token verification needed since there's no server) is used purely to obtain a stable user identifier (Google's `sub` claim or account email) so that every record written to IndexedDB is keyed by `userId` from day one. This is explicitly _not_ a security control in Phase 1: anyone with access to the signed-in browser profile can read the IndexedDB data directly. The payoff is entirely forward-looking — when Phase 2 introduces a real backend and server-verified identity, existing local records already carry the correct `userId` and don't need a migration/backfill step.

This is distinct from — and does not weaken — per-user data isolation itself, which is in scope for Phase 1: multiple Google accounts can sign in on the same browser over time (e.g. testing, or a shared device) and each must only ever see records tagged with their own `userId`, both in what's read from IndexedDB and in what's rendered in the UI during the transition from one signed-in account to another. See the `auth` spec's account-switching requirement.

### 7. Theming: token-based provider, single theme registered

Theming is implemented as a design-token system (color, spacing, typography tokens) consumed through a theme provider/context, with `Dark` as the only registered theme object in Phase 1. Adding `Light` or a colorblind-friendly theme later is a matter of registering a new token set, not restructuring how components consume theme values. No theme-switcher UI ships in Phase 1 since there is nothing to switch to.

### 8. Localization: three independent preferences, each with layered defaults

Locale-driven behavior splits into three independently selectable preferences rather than one bundled `id-ID`-style setting, so a combination like English UI text with Indonesian number formatting is a normal, supported choice, not an edge case:

- **Language** — controls UI text only (English or Indonesian).
- **Number format** — thousands/decimal separators and digit grouping (e.g. `50.000` vs `50,000`).
- **Date format** — a closed choice of exactly three options: `YYYY-MM-DD` (ISO 8601), `DD-MM-YYYY`, or `MM-DD-YYYY`. No other date format is offered, and there is no separate locale-driven guessing of arbitrary date conventions — keeping this to three named options avoids building a general date-formatting-convention system for a Phase 1 with one real user.

Time is not a user preference in Phase 1: it is always displayed in 24-hour format, with no 12-hour option. This removes an entire axis of choice (and the "AM/PM in which language" question that would come with it) that nothing currently requires.

Each of the three is a freely changeable Settings value, not a live-recomputed one. The Google-account-locale → browser-locale fallback chain only determines the _initial_ value seeded into Settings when a user's account is first set up — it is not re-evaluated on every render, and there's no ongoing distinction in the code between "explicitly set" and "defaulted." Once a value exists in Settings, that's simply what's used, until the user changes it. Each preference has its own fixed, hardcoded final fallback for when neither the Google account nor the browser locale can determine it: English for language, Indonesian conventions for number format, and `YYYY-MM-DD` for date format (a neutral, unambiguous choice rather than defaulting to either Indonesian or US date ordering). A user can end up with each preference seeded from a different source (e.g. language from an explicit choice, number format inherited from Google account locale, date format falling all the way back to its hardcoded default) without one affecting the other two.

Currency **symbol and placement** (e.g. `Rp` vs `$`) are not part of this decision — they follow directly from the base/reporting currency itself (Decision 5, a separately locked setting), while the number format preference here only governs how the digits around that symbol are grouped and separated.

### 9. Backup and restore: Google Drive API, not SQLite-as-a-file or File System Access API

The data-loss risk of a single-user, browser-only Phase 1 (clearing browser storage, or losing the device, deletes all data) is addressed with an explicit backup/restore feature rather than by changing the storage engine. Three approaches were considered:

- **Switching the storage engine to SQLite-WASM**, on the assumption it produces a real, backup-able file. Rejected: browser SQLite (via OPFS or an in-memory engine like sql.js) is still browser-sandboxed storage, exactly as invisible to the OS filesystem (and to Drive's sync agent) as IndexedDB. Changing engines does not, by itself, solve the backup problem.
- **File System Access API**, writing directly into a user-chosen local folder (e.g. a Drive-desktop-synced folder). Rejected for Phase 1: Chromium-only, requires the Google Drive desktop app to be installed and actively syncing that folder, and requires re-granting folder permission periodically.
- **Google Drive API upload (chosen)**: since the app already performs Google Sign-In, it requests one additional incremental OAuth scope (`drive.file`, which limits the app to files it itself creates — not full Drive access) and uploads a backup file directly via the Drive API. Works in any browser, has no dependency on a local Drive desktop client, and the same approach extends to the future native mobile app.

**What gets backed up**: all of the signed-in user's categories and entries, serialized to a single file, created/updated via the `drive.file`-scoped Drive API. Each backup run overwrites the same file rather than creating a new dated file per run — this keeps Drive uncluttered and avoids the app needing its own retention/cleanup logic, at the cost of not retaining older backup generations within the app itself (Drive's own revision history is the only fallback here; see Non-Goals).

**Trigger**: automatic, not manual, and activity-based rather than a fixed wall-clock interval. A purely time-based trigger (hourly, daily, or any other fixed interval) only fires while the tab remains open long enough to reach that interval — for this app's realistic usage pattern (open the app, log an entry, close the tab within a couple of minutes), a fixed interval would frequently never fire at all, regardless of how small the interval is. Instead, the primary trigger is a **debounced backup shortly after write activity settles**: once a user creates, edits, or deletes a category or entry, the system waits for a short quiet period (on the order of 1-2 minutes of no further writes) and then runs a backup while the tab is still open. This reliably catches every session that makes a change, independent of session length, and — because entries are already low-frequency by design (Decision on financial entries: periodic/aggregated, not a full transaction ledger) — it fires rarely enough to avoid the Drive API call volume concern that ruled out backing up on every single change. Sign-out remains a secondary trigger for the minority of sessions that end that way. The last successful backup timestamp (and whether anything has changed since) is tracked locally, so a sign-out immediately following a just-completed debounced backup doesn't trigger a redundant second upload.

**Restore**: two entry points.

1. **Automatic offer on sign-in**: if the signed-in user has no local data in IndexedDB but a Drive backup file exists for their account, the app offers to restore it. This is the primary "new/replacement device" recovery path.
2. **Manual restore, available anytime in Settings**: lets the user force-restore even when local data already exists (e.g. recovering from an accidental deletion). Because this discards current local data, it requires explicit confirmation before proceeding.

Restore is a full replace, not a merge — merge semantics (reconciling two divergent sets of categories/entries) would add substantial complexity for a single-user Phase 1 and aren't needed until real multi-device sync exists in a later phase.

**Failure handling**: backup runs are best-effort and non-blocking — a failed backup (network issue, revoked Drive permission, quota) must not prevent the user from continuing to use the app normally. The last-backup status/timestamp is surfaced in Settings so a failure is visible rather than silent.

### 10. Code organization: thin Expo Router layer, feature modules per capability, pure domain logic isolated

The project already fixes two structural facts: Expo Router (file-based routing) with its route root at `src/app` (configured in `app.json`), and a `@/*` → `src/*` path alias (`tsconfig.json`). Everything else under `src/` is organized as follows:

```
src/
  app/                     # Expo Router routes — THIN: each file only mounts a feature screen. Named `app` (not `routes`) because it is Expo's convention.
    _layout.tsx            # root providers: repositories, auth session, theme, i18n
    sign-in.tsx            # unauthenticated entry point
    (main)/                # auth-guarded route group
      _layout.tsx          # session guard + tab navigation
      index.tsx            # dashboard
      categories.tsx
      entries/
        index.tsx          # entry list
        new.tsx            # entry creation (incl. first-entry base-currency confirmation)
      reports.tsx
      settings.tsx
  domain/                  # pure TypeScript — no React, no storage, no platform imports
    models.ts              # Category, Entry, EntityType, UserSettings, currency types
    rollup.ts              # recursive category rollup (Decision 3)
    category-tree.ts       # reparenting + deletion-reassignment rules (Decision 4)
    net-worth.ts           # historical net worth computation from snapshots
    fx.ts                  # entry-currency → base-currency conversion helpers
  data/
    repository-ports.ts        # CategoryRepository / EntryRepository / SettingsRepository interfaces
    indexeddb/             # web implementations (via `idb`), all records keyed by userId
    seed.ts                # starter-category seeding on first sign-in
    RepositoryProvider.tsx # React context (DI) — calling code never references IndexedDB
  features/                # one folder per OpenSpec capability: screens, components, hooks
    auth/                  # Google Identity Services flow, session state, userId derivation
    categories/            # tree management UI
    entries/               # snapshot/transaction forms, base-currency confirmation flow
    reports/               # net worth chart, category breakdown, income/expense trend
    backup/                # Drive API client, serialization, debounce trigger, restore flows
    settings/              # settings screen sections
  shared-ui/               # shared presentational primitives (Button, Card, …) — theme tokens only, no domain knowledge
  theme/                   # design tokens, dark theme object, ThemeProvider, useTheme (Decision 7)
  i18n/                    # en/id resources, number/date formatting, preference resolution (Decision 8)
```

**Route files are thin by rule.** `src/app/` is a routing convention — filenames are URLs, and Expo Router owns that directory's shape. Screens, forms, and hooks live in `features/`, and a route file does nothing but import and render one of them (plus route-level concerns like the auth guard in the group layout). This keeps navigation restructuring (e.g. different navigation idioms on native in a later phase) from touching feature code, and vice versa.

**`domain/` is pure and imports nothing from the other layers.** Rollup computation, deletion reassignment, net-worth math, and FX conversion are the logic most worth unit-testing and the logic most likely to move server-side in Phase 2 — keeping them free of React and storage imports means they're testable without rendering or IndexedDB, and portable verbatim later.

**`data/` realizes Decision 2's platform split.** Interfaces in `repository-ports.ts`; the web implementation in `indexeddb/`; a future native implementation is a sibling folder (e.g. `sqlite/`) selected in `RepositoryProvider` — either explicitly or via Metro's `.web.ts`/`.native.ts` resolution. No calling code changes when that happens.

**`features/` folders map 1:1 to the change's capabilities** (`auth`, `categories`, `financial-entries` → `entries`, `reporting` → `reports`, `drive-backup` → `backup`, plus `settings` as the screen that composes several capabilities' controls). This keeps the spec ↔ code correspondence obvious when verifying scenarios in QA. `theming` and `localization` are cross-cutting rather than screen-owning, so they live as top-level `theme/` and `i18n/` instead of feature folders.

**Import direction is one-way:** `app` → `features` → (`domain`, `data`, `shared-ui`, `theme`, `i18n`), and `data` may import `domain` models — never the reverse, and `domain` imports nothing. Features do not import from other features; anything two features need moves down into `domain`, `data`, or `shared-ui`.

**The rules are the contract; the tree above is a snapshot.** The durable commitments of this decision are the boundaries and import rules (thin routes, pure `domain/`, one-way imports, no feature-to-feature imports) — not the exact file listing, which is illustrative and expected to evolve without a design revision. In particular, `domain/` starts flat and subdivides into subdomain folders (e.g. `domain/valuation/`) when a new subdomain arrives (e.g. budgeting) or the flat list grows crowded (~10+ files). That split is deliberately deferred: it's a mechanical file move whenever it happens, and doing it _then_ means drawing boundaries along seams visible at that moment rather than guessed in advance (today's seams are still ambiguous — `rollup` spans tree structure and valuation, `fx` is used by both would-be clusters).

**`domain/` membership is a rule of movement, not a census.** Pure logic lives in the feature that owns it until a second feature needs it, or until it's clearly destined to move server-side in Phase 2 — then it moves down into `domain/`. This keeps `domain/` the shared kernel rather than a mandatory home for everything pure, so future feature-specific logic doesn't pile into the shared domain just because it happens to be pure.

**Module ownership map (future team boundaries).** Fin's capabilities cluster into four modules, each coherent enough for a future team/PM to own its roadmap with changes mostly staying inside the boundary. This is an ownership view over the layered layout above, not a different physical structure:

| Module                   | Owns (today's folders)                                                                         | Future roadmap examples                            |
| ------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Ledger** (write side)  | `features/categories`, `features/entries`, `domain/{models,category-tree,rollup,fx}`, `data/*` | bank/ledger import, richer capture and edit flows  |
| **Insights** (read side) | `features/reports`, `domain/net-worth`                                                         | budgets, goals, projections, display-currency view |
| **Account**              | `features/auth`, `features/backup`                                                             | Phase 2 backend, sync, export, account deletion    |
| **Foundation**           | `theme/`, `i18n/`, `shared-ui/`, `app/`, `features/settings` (shell)                           | design system, new platforms                       |

Categories and entries are one module because they change together (entry forms embed category pickers, deletion reassigns entries, rollup spans both). `fx` belongs to Ledger because the FX rate is captured at entry time and stored on the entry; rollup is part of Ledger's read API, parameterized by a `valueOf` callback so the tree walk itself stays purely structural. The Settings screen is a composition point — each module contributes its own section. Cross-module dependency rules: Insights reads Ledger and never writes; Account's backup imports Ledger's repositories to serialize/restore; **Ledger never imports auth — the current `userId` is injected via the app shell/provider context** (this is what keeps the module graph acyclic); every module may use Foundation. `domain/models.ts` is the shared kernel — owned by Ledger, read by all; schema changes there are cross-module events, so it stays small. Phase 1 keeps the physical layout layered (one developer); if separate teams form later, restructuring into vertical `modules/<name>/` folders is a mechanical move precisely because the import rules above already enforce the coupling discipline team ownership requires.

**Clean Architecture correspondence and `// CCA: <n>` file tags.** The layering follows Clean Architecture's dependency rule (imports point inward): **1** = Entities (`domain/`), **2** = Use Cases (feature hooks, plus repository _interfaces_ as ports), **3** = Interface Adapters (repository implementations, Drive API client, i18n formatters), **4** = Frameworks & Drivers (`app/` routes, React components/providers, IndexedDB, Google APIs). Phase 1 deliberately has no explicit use-case layer — feature hooks play that role informally, and orchestration logic drifts down into named pure functions when a hook grows thick enough to want testing without rendering, or when Phase 2 needs the same orchestration server-side (the same rule of movement as `domain/` membership). Every source file under `src/` carries a first-line comment `// CCA: <n>` declaring its layer; the review check is that a file only imports files with an equal or lower number. The tag carries information the directory path can't: `data/repository-ports.ts` (ports) is `// CCA: 2`, its sibling `data/indexeddb/*` implementations are `// CCA: 3`, and `data/RepositoryProvider.tsx` (React DI wiring) is `// CCA: 4`. Enforcement is by convention and review in Phase 1; a lint rule (import-boundary checking) can automate it later if violations actually show up.

### 11. Testing: one Jest runner (jest-expo preset), React Native Testing Library for component tests

All test kinds run under a single Jest runner using the `jest-expo` preset (version-matched to the Expo SDK): pure-TS domain tests, repository tests against `fake-indexeddb`, and component tests. The preset earns its keep on the component tests — React Native ships untranspiled code that a stock runner can't consume, and `jest-expo` supplies the required transforms and Expo/RN native-module mocks. Pure domain tests need none of that (Decision 10), but running them under the same runner costs only startup time at Phase 1 scale, and one runner means one config, one `npm test`, one CI step.

Component tests use `@testing-library/react-native`, which renders the React Native component tree directly. Two alternatives were rejected:

- **Vitest for the pure-TS tests** — faster in isolation, but React Native components are not well supported, so it would coexist with Jest rather than replace it: two runners and two configs to keep a handful of domain tests marginally faster.
- **`jest-expo/web` + `@testing-library/react` + jsdom** — renders through react-native-web, which is closer to what Phase 1 users actually run, but those tests would not carry over when native builds arrive, whereas RNTL tests are platform-agnostic. Consistent with Decision 1's rationale (Phase 1 code is not a throwaway prototype), tests are written once for all eventual platforms.

Component-level testing is deliberately thin in Phase 1 (a render smoke test guarding i18n wiring); the unit-test weight stays on `domain/` per Decision 10.

**Version constraint: Jest stays on the 29.x line until jest-expo targets 30.** `jest-expo@57` bundles Jest-29-pinned internals (notably `jest-environment-jsdom@29`, which pins `jest-mock@29`), so running the CLI from `jest@30` mixes jest-mock 29 into a Jest 30 runtime and crashes at startup (`this._moduleMocker.clearMocksOnScope is not a function`). `@types/jest` follows the same 29.x line. Revisit when a jest-expo release declares Jest 30 support. Relatedly, `@testing-library/react-native@14` uses the `test-renderer` package (peer dep) instead of the deprecated `react-test-renderer`, and its `render()` is async — tests must `await render(...)`.

### 12. Dependency versioning: Expo-managed versions are changed only via `npx expo install`, never hand-bumped

Two versioning regimes coexist in `package.json`, and the split is deliberate:

- **Expo-managed** — `expo`, every `expo-*` package, `react`, `react-dom`, `react-native`, and the `react-native-*` packages. Their versions (and range styles: `~` on Expo packages, exact pins on React/RN) are whatever `npx expo install` writes for the current SDK, because these packages are compatibility-coupled to the SDK release, not independently upgradable. They change only through `npx expo install <pkg>` / `npx expo install --fix`, typically as part of an SDK upgrade; `npx expo install --check` verifies the set. Hand-editing one of these (or accepting an automated dependency-bump PR for it) is the failure mode this rule exists to prevent.
- **Everything else** (e.g. `i18next`, `react-i18next`, `idb`, dev tooling) — ordinary npm packages on default `^` ranges, upgraded on their own schedule, with peer-dependency ranges as the compatibility contract. Major version numbers across packages don't correlate (React 19 alongside `react-i18next` 17 is normal, not a mismatch). The one current exception is the test stack's Jest 29 pin, documented in Decision 11.

### 13. CI: GitHub Actions as the authoritative merge gate on `main`

A single GitHub Actions workflow runs the four existing npm scripts (`lint`, `format:check`, `typecheck`, `test`) on every pull request and on pushes to `main`, and branch protection makes that workflow a required status check — nothing merges to `main` without CI passing, enforced for admins too. The division of labor with the pre-commit hook (husky + lint-staged, task 1.5) is deliberate: the hook is a fast, staged-files-only convenience that auto-fixes and can be bypassed with `--no-verify`; CI checks the entire repo and cannot be bypassed, so CI is the gate and the hook is merely a way to avoid failing it. The workflow is a quality gate only — Phase 1 has no build or deploy step, so CI deliberately runs no `expo export` or hosting step until there's somewhere to deploy.

**Third-party actions are pinned to a full commit SHA, not a version tag** (e.g. `actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1`, not `actions/checkout@v4`) — a tag can be repointed by whoever controls the action's repo, so pinning by tag means a compromised or malicious upstream update runs in CI on the next push with no change on this repo's side; a SHA is immutable. The trailing `# vX.Y.Z` comment keeps the pin human-readable and lets Dependabot (configured for the `github-actions` ecosystem) open update PRs the normal way. The workflow also sets `permissions: contents: read` at the top level so the default `GITHUB_TOKEN` carries no more access than the checks need.

Use the latest release of each action. The action's major version is independent of the project's Node version — `setup-node` resolves `.nvmrc` against a live version manifest fetched at run time, and the Node runtime the action itself executes on is bundled with the runner, not taken from the project.

### 14. Styling authoring convention: memoized `StyleSheet.create` factories, inline `style` only for dynamic or one-off values

Decision 7 governs _where_ style values come from (theme tokens via the provider); it does not govern _how_ a component authors its styles. The memoized factory pattern — `const styles = useMemo(() => createStyles(theme), [theme])` over `StyleSheet.create(...)` — is the standard. Inline `style` is reserved for two specific cases:

1. **Values that genuinely vary per render** — e.g. `Button`'s `labelColor`, which depends on `variant` and `disabled` and so cannot live in a static stylesheet. `Button` is the reference example: static rules in `createStyles`, the one computed color inline.
2. **A single one-off override** passed through a `style` prop to compose with a component's own styles (e.g. `<Card style={{ marginTop }}>`).

The rationale is specific to this project, not generic RN dogma:

- **react-native-web (the Phase 1 target) compiles `StyleSheet.create` styles into deduplicated atomic CSS classes**, whereas inline object literals become per-element inline `style` attributes. The factory therefore produces smaller, more reused output on web — which matters most in repeated rows like `CategoryTree`.
- **Inline literals allocate a fresh style object every render**, defeating child memoization; the memoized factory allocates once and only recomputes if `theme` changes (never, in single-theme Phase 1).
- A plain module-level `StyleSheet.create` (the textbook RN idiom) is deliberately _not_ the convention here, because tokens are runtime values read from context — the styles must be built from a `theme` argument, so the memoized `createStyles(theme)` factory is the correct shape.

Third-party styling systems (NativeWind, styled-components, etc.) are explicitly out of scope: they add dependencies the design never calls for, and the token-provider architecture already delivers the theme-swap guarantee (Decision 7) that would be their main draw. Enforcement is by convention and review in Phase 1, consistent with the `// CCA` tags (Decision 10); a lint rule can automate it later if drift recurs.

## Risks / Trade-offs

- **[Risk]** Drive backup runs are best-effort and activity-triggered — data written in the debounce window (roughly the last 1-2 minutes) immediately before a device is lost is still at risk if the debounced backup hadn't completed yet. → **Mitigation**: the debounce window is short by design, and the sign-out trigger covers sessions that end deliberately; a manual "back up now" affordance could be added later if this proves insufficient, though it wasn't chosen for Phase 1 (see Decision 9).
- **[Risk]** Revoked or expired Drive OAuth permission silently stops backups from running. → **Mitigation**: last-backup status/timestamp is surfaced in Settings (Decision 9) so a stale backup is visible rather than silent.
- **[Risk]** In-memory rollup computation over the category tree could become slow as entry/category counts grow. → **Mitigation**: start simple; add materialized ancestor paths only if profiling shows a real bottleneck (Phase 1 data volume for one user is small).
- **[Risk]** Retroactive rollup changes from reparenting could surprise users reviewing old reports ("why did last month's total change?"). → **Mitigation**: this is a deliberate design choice (Decision 4); consider a subtle UI affordance later (e.g. "category structure last changed on X") if it proves confusing in practice — out of scope for Phase 1 implementation.
- **[Risk]** Manual FX rate entry is tedious and error-prone compared to live rates. → **Mitigation**: accepted trade-off for Phase 1; live FX lookup is an explicit future enhancement that doesn't require a data model change (Decision 5).
- **[Risk]** Auth without a security boundary could mislead a future contributor into assuming Google Sign-In protects data. → **Mitigation**: documented explicitly here and in the `auth` spec; Phase 2 design must revisit this when a backend is introduced.
- **[Risk]** Locking base currency after the first entry means a user who picks the wrong one early is stuck with it (short of manually deleting all data and starting over). → **Mitigation**: default is suggested from locale (usually correct on the first guess), and the lock only applies once an entry actually exists — the user has unlimited opportunity to change their mind before that point.

## Open Questions

- Exact seeded starter category list per `entityType` (specific names/depth) — left to implementation/tasks rather than design, since it's content, not architecture.
- Exact backup file format (e.g. JSON export of categories/entries) and naming — left to implementation, not architecture.

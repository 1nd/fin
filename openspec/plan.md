# Fin — Overview Plan

Fin is a purpose-built personal finance app that replaces ad-hoc spreadsheet
tracking. It tracks **net worth** (assets/liabilities) and **budgeting**
(income/expenses) with built-in history, arbitrary-depth categorization, and
multi-currency support — architected from day one to grow into a multi-user,
cross-platform (web/iOS/Android) product without a rewrite.

## Core thesis

Spreadsheets store *states*, so seeing a trend requires manually duplicating
rows/sheets per month. Fin stores **dated facts** — snapshots, transactions,
exchange rates — and derives any state as a pure function of them:

```
balance(account, t) = last snapshot ≤ t  +  Σ txns in (snapshot, t]
rate(pair, t)       = most recent rate entry ≤ t          (carry-forward)
net worth(t)        = Σ balance(a, t) × rate(currency→base, t)
```

One temporal idiom everywhere: **sparse dated facts + as-of lookup**. Trend
reporting is these formulas evaluated at every month-end — no materialized
monthly copies, ever.

## Decisions

### Domain model

- **Balance model — snapshot-anchored:** `balance = last snapshot + Σ transactions since`.
  Snapshots are authoritative overrides; the delta between a snapshot and the
  derived balance surfaces *untracked activity* — a feature, not an error.
  Rejected alternatives: (a) snapshots and transactions as unrelated
  subsystems — matches the spreadsheet habit but the two never reconcile and
  the untracked-activity signal is lost; (b) a full double-entry ledger where
  balances are derived purely from transactions — one source of truth, but a
  heavy data-entry burden and ill-suited to snapshot-natural holdings (401k,
  house).
- **Transactions require an account.** No unlinked expenses; entry friction is
  managed with defaults, not by weakening the model.
- **Accounts and categories are both trees, but distinct entities.** Both are
  mutable trees of arbitrary depth with rename/move/split/merge freedom, built
  on **one shared tree mechanism** (pure, entity-layer). They stay separate
  entities because their temporal semantics differ — the stock/flow split:
  - **Account (stock):** value is state carried forward — as-of query
    (`last snapshot ≤ t + Σ txns since`). Snapshots apply. Net worth sums the
    tree at an instant. Balances live in a denomination.
  - **Category (flow):** value is movement summed per period — no
    carry-forward. Snapshots are meaningless. Budget reports sum the subtree
    over an interval. A category aggregates entries of any currency.
  (Unifying them into one tree is the double-entry move — GnuCash/Beancount —
  but it only works honestly under the full-ledger discipline rejected above.
  Under the snapshot-anchored model the stock/flow line is load-bearing.)
- **Rollup convention (both trees):** an entry on a node means value held or
  moved *directly at* that node, excluding descendants; rollup = own entries
  + descendants'. Entries may sit on internal nodes of either tree,
  indefinitely — leaf-only is *not* a rule. Because every entry lives on
  exactly one node and rollup sums entries (never node totals over nodes),
  the mechanism counts each fact exactly once: structural double-counting is
  impossible.
- **Categories:** the tree reflects *current* structure; history follows HEAD
  (splitting `Food` into `Food > Groceries` / `Food > Dining` retroactively
  re-frames old data). Splitting/merging is free: flows are counted once, in
  their period — no extra bookkeeping.
- **Accounts:** hierarchy groups accounts (e.g. `Banks > BCA > Savings`); net
  worth rolls up by subtree; a parent may hold a direct balance alongside
  children. Unlike categories, a split is not free: snapshots carry forward,
  so a now-split parent's last snapshot would keep projecting into rollups
  (double-count). The split action therefore **auto-creates a zeroing
  snapshot** on the parent's own series at the split date — the recorded
  handoff. Net effect: splitting an account *feels* identical to splitting a
  category; pre-split history stays on the parent and its rollup trend is
  continuous across the split.
- **One semantic caveat:** the model cannot verify that a parent-account
  snapshot really excludes money already tracked on its children (e.g.
  snapshotting `BCA` using the bank app's *total* while also snapshotting
  `BCA > Savings` — overlapping facts, each still counted once). UI
  mitigation: when snapshotting an account that has children, label the field
  "directly held, excluding sub-accounts" and/or warn.

### Multi-currency

- Every entry (transaction, snapshot) carries its native `(amount, currency)`.
  Stored amounts are never converted.
- **Central rate table** keyed `(currency pair, day)`. Daily granularity;
  lookup is as-of (most recent entry ≤ t).
- **Write path prompts, read path never blocks:** entering a foreign-currency
  fact requires filling in that day's rate (which densifies the table);
  reports always compute using carry-forward, flagging stale-rate data points
  with a one-tap backfill. A live rate API (later phase) is just another
  writer to the same table.
- **Base currency is a reporting preference, not a data commitment.** It's the
  unit sums and charts are expressed in; changing it re-evaluates reports with
  zero migration. Defaulted from locale (e.g. Indonesian → IDR).

### Identity, storage, backup

- **Google Sign-In** for identity, **required before entering data** and
  landing early in the roadmap (right after the foundation). In Phase 1 it is
  *identity convenience, not a security boundary* — anyone with browser access
  can see the data. Payoffs: no registration flow, locale defaults, Drive
  permission for backup.
- **Multiple Google accounts on the same browser are distinct users** with
  fully separate data partitions — e.g. a friend test-driving Fin on the
  author's laptop. Sign-out / account switching is in the sign-in change's
  scope.
- **All storage keyed by userId from day one.** This is the cheapest
  multi-user-without-rewrite move. Because sign-in precedes every data-entry
  feature, records are born under their owner's Google id — no "local user"
  migration policy ever exists. (During the foundation change only settings
  exist; they live under a placeholder id until sign-in lands.)
- Phase 1 persistence: **IndexedDB** behind the CCA layer-4 boundary, with
  `navigator.storage.persist()` requested (browser storage is evictable).
- **Backup, not sync, in Phase 1.** Backup guards against *both* browser
  storage eviction *and* lost/broken/replaced devices: on a new device, sign
  in → restore from Drive → continue. JSON export/import (escape hatch and
  the server-migration vehicle for Phase X) plus Google Drive backup to the
  hidden `appDataFolder` scope — same exporter, two destinations; each user's
  backup lives in their own Drive. Drive backup carries a **divergence
  guard**: each backup records the version it was based on; if Drive holds
  something newer (edited from another device), warn instead of overwriting.
  Record ids + tombstone-friendly deletes go in the schema now so
  record-level merge or server sync slots in later. Real multi-device sync is
  solved by the Phase-X server, not by Drive-merge engineering we'd throw
  away.

### Localization (all independent user preferences)

- **Language:** English + Indonesian in Phase 1; adding a language = adding a
  message catalog. No user-facing string hardcoded in components.
- **Number format** (decimal/thousand separators) decoupled from language.
- **Date format:** ISO 8601 `YYYY-MM-DD`, `DD-MM-YYYY`, or `MM-DD-YYYY` —
  decoupled from both.
- **Time:** 24-hour only.
- **Default cascade:** Google account locale → browser locale → fallback;
  every preference overridable in Settings. The cascade is a pure function
  (entity-layer material).

### Theming & UI

- **Semantic design tokens from the first component.** Components never
  mention raw colors; a theme is a token set. Phase 1 ships Dark only;
  later themes (e.g. Light, colorblind-friendly) ship as new token sets
  with no app rewrite.
- **Never encode meaning by color alone** (income/expense, chart series):
  pair color with sign, icon, or label.
- **Responsive from Phase 1:** desktop + tablet + phone browser. Desktop
  web stays first-class in every phase. Once Phase Y ships iOS/Android,
  web/iOS/Android have freedom to implement a given feature differently
  per platform — typically because a native OS offers a capability the
  browser doesn't — but the goal is no feature gaps between them.

### Architecture

- Clean Code Architecture layers per `AGENTS.md` (`// CCA: <n>` tags,
  dependency rule). Pure TS domain core (layers 1–2); storage, rate sources,
  identity, and backup destinations are swappable adapters (layers 3–4).
- Recurring pattern: **two adapters, one entity** (manual rate entry vs rate
  API; file export vs Drive backup; local user vs Google identity).

### Engineering practices

- **Decide tech in the change that first needs it.** plan.md records
  constraints; concrete picks (UI framework, styling tech, test runner, CI
  provider) are design.md decisions — nearly all in ① app-foundation.
  Constraints the picks must satisfy:
  - UI framework lives only in CCA layer 4; layers 1–2 stay pure TS.
    Adding iOS/Android — whenever it's prioritized; phase ordering is not
    a promise of distance — must not require an app rewrite: everything
    below the layer-4 UI ring ports unchanged, and layer 4 stays thin
    (presentational components; behavior in pure functions and DOM-free
    hooks) so the port surface is screens and styling only.
  - Styling tech must consume the semantic token layer; no hardcoded
    colors regardless of approach.
- **Testing:** layers 1–2 hold all the interesting math (balance derivation,
  rollups, as-of rate lookup, preference cascade) and are pure — they get
  fast unit tests written alongside the code. Adapters/UI get lighter
  testing. Runner chosen in ①. Like i18n and tokens, a discipline from ①
  onward, not a standalone change.
- **CI:** from ① onward, lint + tests run automatically on every push
  (provider chosen in ① alongside repo hosting; ESLint/Prettier also run on
  commit per AGENTS.md).
- **Every change ships a runnable app, manually testable locally.** E.g.
  after ①: open the app, see the responsive shell in dark theme, switch
  language and formats in Settings. Placeholder content is fine; a change
  whose result can't be seen and clicked locally is mis-scoped. Every
  change's tasks end with a manual verification step.

## Phasing

1. **Phase 1 — web + local:** primary user is the author (friends may
   test-drive as distinct users), IndexedDB, Google Sign-In, Drive backup,
   responsive web. Scope below.
2. **Phase X (a future phase, after 1) — web + online:** server-backed,
   multi-user, real sync (offline support nice-to-have), live rate API.
3. **Phase Y (a future phase, after X) — + iOS + Android.**

Only Phase 1 is a committed, numbered milestone; X and Y are long-term
direction whose exact sequence/numbering is deliberately undecided.

## Phase 1 change roadmap

```
 ①  app-foundation
 │   repo + tooling init (framework pick, lint/format, tests, CI), shell,
 │   CCA layout, IndexedDB adapter (keyed by userId), i18n (en/id),
 │   theme tokens (dark), responsive layout,
 │   Settings page with preference cascade (lang/number/date/theme)
 │
 ②  google-signin
 │   Google identity, required before data entry; per-account data
 │   partitions (multi-account on same browser); sign-out / switching
 │
 ③  accounts-and-snapshots
 │   shared tree mechanism, account tree (asset/liability, grouping,
 │   split/merge with close-out), dated balance snapshots,
 │   net worth "as of today" with subtree rollup — single currency
 │        │
 │        ├──── ④  backup
 │        │      JSON export/import, Drive backup + restore (appDataFolder)
 │        │      with divergence guard; recovers from storage eviction
 │        │      and lost/replaced devices
 │        │
 │        ├──── ⑤  categories-and-transactions
 │        │      category tree (reuses tree mechanism), transactions
 │        │      (require account), snapshot-anchored balance derivation,
 │        │      untracked-delta signal
 │        │
 │        └──── ⑥  multi-currency
 │               currency on entries, central rate table, write-prompt /
 │               read-carry-forward, base currency as reporting preference
 │                    │
 ⑤ ⑥ ────────────────┴──── ⑦  reporting
                            net worth trend, category trends, staleness flags
```

- **② early on purpose:** identity precedes every data-entry feature, so all
  records are born under their owner's Google id — friends can test-drive on
  any browser (including the author's) as distinct users, and no local-user
  migration ever exists.
- **③ is the earliest "stop using Sheets" moment:** enter monthly balances,
  see net worth — the spreadsheet's core ritual replaced, exercising the
  whole stack on the simplest entity.
- **④ early on purpose:** backup guards real data from the moment it exists
  (browser eviction, broken laptop → sign in on a new device and restore).
  Needs only ② plus something worth backing up.
- **⑤ and ⑥ are independent** — sequence by personal urgency. ⑦ needs both
  (trends must revalue currencies *and* roll up categories).
- **Cross-cutting disciplines (i18n, tokens, responsiveness, CCA) are not
  changes** — they're established in ① and are obligations on every
  subsequent change.
- Expected main-spec capabilities these changes build up: `settings`,
  `accounts`, `transactions`, `categories`, `currency`, `reporting`,
  `identity`, `backup`.
- **Propose one change at a time** (propose → implement → archive → next), so
  each proposal is written against the actual state of the code and learning
  folds forward instead of invalidating queued proposals.

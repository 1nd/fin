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
  landing early in the roadmap (before any data-entry change). In Phase 1 it is
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

### URLs & navigation

- **Views are URL-addressable and browser back navigates within the app**
  (e.g. Settings at `/settings`), with refresh restoring the current view.
  Established in (H) (url-routing); from (H) onward an obligation on every
  change, like i18n and tokens.
- **Selective addressability:** routing makes a bookmarkable, shareable URL
  *possible* wherever one is wanted — never mandatory everywhere. Each
  change decides which of its views (or entities) earn URLs; the target is
  never making everything bookmark-able.
- **History-API URLs (clean paths), not hash URLs.** Discipline: every link
  goes through the router, so hash mode remains a config-level fallback
  rather than a rewrite if a host ever demands it.
- **Deployment must never force a rewrite.** Phase 1 hosting is
  deliberately undecided (the author runs Fin via localhost for now); no
  specific host, path prefix, or server capability may be assumed in app
  code. That Phase 1's build output happens to be a static SPA is a fact,
  not a commitment: it keeps the cheapest hosts available (static
  platforms — which must then serve the app for unknown paths, "SPA
  fallback", for history-API URLs to work) while never precluding
  server-backed deployment — Phase X adds a server as an addition, not a
  rewrite.
- **Action URLs (a URL that performs on visit, e.g. sign-out) are a
  footgun:** browsers may prerender/prefetch a typed URL and execute the
  app, firing the action without user intent. Policy (decided in (H),
  binding on every change): (1) default is to not ship action URLs —
  side effects belong on explicit in-page interactions, which are never
  prerendered; (2) a change with a real reason to ship one must have the
  URL render an inert confirmation view whose side effect fires only on
  an explicit user gesture — a gesture requirement inherently defeats
  prerender; `document.prerendering` checks are defense-in-depth, not
  sufficient alone; (3) any action URL's spec must include a "visited by
  prerender/prefetch → no side effect" scenario. The spec-level
  requirement lives in the `url-routing` capability.

### Architecture

- Clean Code Architecture layers per `AGENTS.md` (`// CCA: <n>` tags,
  dependency rule). Pure TS domain core (layers 1–2); storage, rate sources,
  identity, and backup destinations are swappable adapters (layers 3–4).

### Engineering practices

- **Requirements are informed by, not coupled to, real-world practice.**
  Real-world situations (market conventions, quoting practices, regulations)
  are evidence motivating a requirement, never its source of truth. In
  rationale, cite them as examples ("informed by, e.g., Indonesian fund unit
  prices being quoted to four decimals"), not as the normative basis
  ("because X does Y, the system SHALL…"). If the practice shifts, the
  requirement is reassessed deliberately — it never updates automatically.
- **Decide tech in the change that first needs it.** plan.md records
  constraints; concrete picks (UI framework, styling tech, test runner, CI
  provider) are design.md decisions — nearly all in (A) (app-foundation);
  the URL router pick is (H)'s (url-routing).
  Constraints the picks must satisfy:
  - UI framework lives only in CCA layer 4; layers 1–2 stay pure TS.
    Adding iOS/Android — whenever it's prioritized; phase ordering is not
    a promise of distance — must not require an app rewrite: everything
    below the layer-4 UI ring ports unchanged, and layer 4 stays thin
    (presentational components; behavior in pure functions and DOM-free
    hooks) so the port surface is screens and styling only.
  - Styling tech must consume the semantic token layer; no hardcoded
    colors regardless of approach.
- **Corner test (every tech/infra pick must pass it).** An addition or
  modification to Fin must never require rewriting foundation/infra that
  has nothing to do with it — if it does, we trapped ourselves in a
  corner. Justify picks against Fin's eventual shape, never its current
  size ("only two routes today" is not an argument for or against a
  router). A migration or rewrite is acceptable when it is cheap and
  touches only the parts that exist for the rewritten concern; a design
  that picks the simpler option over one that scales better must show the
  later migration stays localized by naming the confined surface it would
  touch (e.g. (H): route table + provider + links, all layer 4). Existing
  bounds are instances of this test: adding iOS/Android must not require
  an app rewrite; deployment must never force a rewrite.
- **Testing:** layers 1–2 hold all the interesting math (balance derivation,
  rollups, as-of rate lookup, preference cascade) and are pure — they get
  fast unit tests written alongside the code. Adapters/UI get lighter
  testing. Runner chosen in (A). Like i18n and tokens, a discipline from (A)
  onward, not a standalone change.
- **CI:** from (A) onward, lint + tests run automatically on every push
  (provider chosen in (A) alongside repo hosting; ESLint/Prettier also run on
  commit per AGENTS.md).
- **Every change ships a runnable app, manually testable locally.** E.g.
  after (A): open the app, see the responsive shell in dark theme, switch
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
 (A)  app-foundation
 │   repo + tooling init (framework pick, lint/format, tests, CI), shell,
 │   CCA layout, IndexedDB adapter (keyed by userId), i18n (en/id),
 │   theme tokens (dark), responsive layout,
 │   Settings page with preference cascade (lang/number/date/theme)
 │
 (H)  url-routing
 │   history-API URL routing behind the shell's navigation seam: existing
 │   views addressable (`/`, `/settings`), browser back navigates within
 │   the app, refresh restores the view; router pick decided in its
 │   design.md; action-URL safety policy in "URLs & navigation" above
 │
 (B)  google-signin
 │   Google identity, required before data entry; per-account data
 │   partitions (multi-account on same browser); sign-out / switching;
 │   popup OAuth UX (no server → redirect flows unavailable; only
 │   origins whitelisted in the Google OAuth client, no redirect URIs)
 │
 (C)  accounts-and-snapshots
 │   shared tree mechanism, account tree (asset/liability, grouping,
 │   split/merge with close-out), dated balance snapshots,
 │   net worth "as of today" with subtree rollup — single currency
 │        │
 │        ├──── (D)  backup
 │        │      JSON export/import, Drive backup + restore (appDataFolder)
 │        │      with divergence guard; recovers from storage eviction
 │        │      and lost/replaced devices
 │        │
 │        ├──── (E)  categories-and-transactions
 │        │      category tree (reuses tree mechanism), transactions
 │        │      (require account), snapshot-anchored balance derivation,
 │        │      untracked-delta signal
 │        │
 │        └──── (F)  multi-currency
 │               currency on entries, central rate table, write-prompt /
 │               read-carry-forward, base currency as reporting preference
 │                    │
 (E) (F) ─────────────┴──── (G)  reporting
                            net worth trend, category trends, staleness flags
```

- **Labels are identifiers, not ordinals** — assigned once, never
  renumbered; execution order and dependencies live in the diagram's
  arrows. (H) postdates the (A)–(G) labeling (it was inserted later), hence the
  out-of-sequence letter for a change that runs second. New changes take
  the next free letter wherever they slot in.
- **(H) inserted before (B) on purpose:** (B)'s sign-in gate is navigation policy
  — a signed-out visit to an addressable view must survive sign-in and
  land where it intended. Landing URL routing first lets (B) design the gate
  against the final navigation model instead of reworking it in a later
  change, and routing is at its cheapest while the app is two static
  views.
- **(B) early on purpose:** identity precedes every data-entry feature, so all
  records are born under their owner's Google id — friends can test-drive on
  any browser (including the author's) as distinct users, and no local-user
  migration ever exists.
- **(C) is the earliest "stop using Sheets" moment:** enter monthly balances,
  see net worth — the spreadsheet's core ritual replaced, exercising the
  whole stack on the simplest entity.
- **(D) early on purpose:** backup guards real data from the moment it exists
  (browser eviction, broken laptop → sign in on a new device and restore).
  Needs only (B) plus something worth backing up.
- **(E) and (F) are independent** — sequence by personal urgency. (G) needs both
  (trends must revalue currencies *and* roll up categories).
- **Cross-cutting disciplines (i18n, tokens, responsiveness, CCA) are not
  changes** — they're established in (A) (URL addressability in (H)) and are
  obligations on every subsequent change.
- Expected main-spec capabilities these changes build up: `app-shell`,
  `settings`, `accounts`, `transactions`, `categories`, `currency`,
  `reporting`, `identity`, `backup`.
- **Propose one change at a time** (propose → implement → archive → next), so
  each proposal is written against the actual state of the code and learning
  folds forward instead of invalidating queued proposals.

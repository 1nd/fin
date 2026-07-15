# Design: app-foundation

## Context

Greenfield repository: only `openspec/plan.md`, `AGENTS.md`/`CLAUDE.md`, and OpenSpec scaffolding exist. `plan.md` defers all concrete tech picks to "the change that first needs it" — which for the framework, styling, i18n, storage, testing, and CI is this one. Constraints already settled in plan.md: TypeScript; CCA layers per `AGENTS.md` with pure-TS layers 1–2; UI framework confined to layer 4 and preferably reusable for Phase Y (iOS/Android); styling must consume the semantic token layer with no hardcoded colors (mechanism unconstrained); all storage keyed by `userId`; en/id catalogs; dark theme only; responsive from day one; lint + tests in CI on every push.

## Goals / Non-Goals

**Goals:**

- Pick and wire the Phase 1 stack (framework, styling, i18n, storage, tests, CI) so changes ②–⑦ inherit working tooling.
- Establish the source layout and CCA tagging discipline, demonstrating the dependency rule end-to-end with the first real vertical: preference cascade → settings store → Settings UI.
- Ship the runnable responsive dark-theme shell with a working Settings page.

**Non-Goals:**

- Google Sign-In, real identity, or per-account partitions (change ②) — this change uses a placeholder `userId`.
- Any finance domain model (accounts, snapshots, transactions, currency) — changes ③+.
- Backup/export (④), Light/colorblind themes, live rate APIs, offline/PWA packaging.

## Decisions

### D1. UI framework: React 19 + Vite

React DOM because Phase 1's product is a responsive web app — but the pick is made under a hard bound from plan.md: adding iOS/Android, *whenever* it's prioritized, must not require rewriting the app. React is the web framework whose mobile path (React Native/Expo) shares the component model, hooks, and reconciler, so going mobile means porting only the layer-4 ring: layers 1–3 (entities, use cases, ports/adapters) carry over unchanged, React hooks and view logic that never touch the DOM port as-is, and what is redone per platform is JSX markup, CSS, and navigation wiring. Disciplines in this change keep that surface thin: components stay presentational (behavior in pure functions and DOM-free hooks), storage sits behind ports (mobile swaps the IndexedDB adapter for e.g. SQLite), i18n catalogs are plain JSON, and theme tokens are semantic names a native renderer can re-implement. Vite for dev server/build: fast, minimal config, first-class Vitest integration. Alternatives: Expo + react-native-web (the pick if iOS/Android moves into the near term — zero port surface across all three platforms, at the cost of worse web output: View/Text emulation instead of semantic HTML, weaker desktop affordances, Metro instead of Vite); Svelte/Vue/Solid (no comparably mature mobile path); Next.js (server framework buys nothing for a local-first IndexedDB app).

The web-first vs Expo + react-native-web call rests on two durable facts, not on Phase Y's distance. *Cost asymmetry:* RNW is a certain, perpetual tax on the daily platform (View/Text emulation, weaker desktop ergonomics, Metro/Jest) paid even if mobile never arrives, while web-first's cost is a bounded layer-4 port paid only if it does — and the cheap pivot runs one way (DOM → Expo while the UI surface is small; unwinding RNW back to DOM never recoups). *Steady state:* desktop web stays first-class in every phase, and while web/iOS/Android should reach feature parity, each platform has freedom to implement a given feature differently — often because a native OS offers a capability the browser doesn't (settled in `plan.md`). That per-platform implementation freedom is exactly what an RNW codebase resists (one shared component tree wants one implementation, forcing `.web`/`.native` forks to diverge at all), whereas the eventual three-platform shape of two idiomatic UI heads — React DOM web + one RN app covering iOS and Android — sharing layers 1–3 and all view-models, gets that freedom for free at the screens that matter most (dense reporting tables, keyboard-driven entry). Charts and gesture-heavy UI need platform-specific code under either approach, so they don't differentiate the options. "Thin" layer 4 means *logic-thin*, not necessarily small: components may be numerous, but they contain nothing worth grieving in a port.

### D2. Styling: CSS Modules over a `tokens.css` custom-property layer

CSS custom properties are the mechanism picked here to realize `plan.md`'s (mechanism-neutral) token constraint: a single `tokens.css` defines semantic custom properties (`--color-bg-surface`, `--color-text-danger`, …); the dark theme is that one file's values, and a future theme is another file scoped by a `data-theme` attribute. Components style via CSS Modules that reference only tokens — enforceable by review/grep since a literal color in a module file is visibly wrong. Alternatives: Tailwind (its design-value utility classes fight the semantic-token constraint and add a compile dialect), CSS-in-JS (runtime cost, couples styling to React and complicates Phase Y).

### D3. i18n: i18next + react-i18next, JSON catalogs

Catalogs are plain JSON per language (`en.json`, `id.json`) — portable to any future runtime including React Native, satisfying "adding a language = adding a catalog." `i18next` is mature and layer-4-only: components call `t()`; nothing in layers 1–2 touches it. Alternatives: `FormatJS`/`react-intl` (heavier message syntax for no current need), hand-rolled lookup (reinvents pluralization/interpolation we'll eventually want).

### D4. Number/date formatting: pure entity-layer formatters, no library

Formatting is a pure function of `(value, preference)` in layer 1 — trivially unit-testable and independent of language per `plan.md`. Because the *values* each preference can take are a small enumerated set today (two separator styles, three date patterns, 24-hour time), the formatters are hand-written per preference rather than driven by `Intl` locale inference or a date library — nothing here needs one yet, and preferences are decoupled from language by design so `Intl`'s locale coupling would be wrong anyway. The number formatter is decimal-correct to the digits shown (it rounds half-up in string space over the float's shortest decimal representation, so `1.005` at two digits displays as `1.01` where `toFixed` yields `1.00`, and a negative rounding to zero never renders `-0.00`). Its default precision is adaptive: two fraction digits, widened to four when the value carries sub-cent precision, so real digits are never hidden behind a fixed two. Four is Fin's own requirement, informed by — not coupled to — real-world quoting practice (e.g. Indonesian stock/bond/mutual-fund unit prices are currently quoted to four decimals, such as `988.3204`); if that practice shifts, the requirement is reassessed deliberately rather than following automatically. Mechanically it rounds at four then trims a trailing `00`, so plain amounts show two digits and float arithmetic noise (`0.1 + 0.2`) still displays as `0.30`; callers can pass an explicit digit count instead. Because floats cannot remember trailing zeros, a price of exactly `988.3200` displays as `988.32` — a guaranteed fixed-four display per asset class is a change-③ policy, decided when amounts get their non-float representation. Display rounding cannot make float *arithmetic* safe for money: change ③ must pick that representation (integer minor units or decimal strings), and formatters then read from it.

This "small set" argument scopes only to the formatter implementation, not to the preference set: adding preferences is meant to stay additive. The seams that keep it so — settled here and in D5/D7 — are an open-map settings store (keyPath `[userId, key]`, so a new preference is a new key with no schema migration), a cascade over an overrides map rather than a hardcoded four, and one independent formatter per preference (display preferences only). Adding a new preference is then a bounded, compile-time-guided change: extend the effective-preferences type, add its fallback default and locale-mapping entry, add a Settings control, and add a formatter only if it transforms a displayed value — no consumer of the other preferences is touched. Adding a *value* to an existing preference (a third separator style, a fourth date pattern) is smaller still: a new enum case, a formatter branch, a UI option. Runtime pluggability (registering a preference without recompiling) is deliberately not pursued — at this scale the typed struct's compiler-guided exhaustiveness is worth more than a definition registry's looser lookups.

### D5. Storage: IndexedDB via the `idb` package, behind a use-case-layer port

Layer 2 defines a `SettingsRepository` (later changes add their own ports); layer 4 implements it on IndexedDB using `idb` (thin promise wrapper, no schema framework lock-in). Schema conventions set now, load-bearing for ② and ④:

- Every record: `{ id, userId, ...payload, updatedAt }`; object-store keys include `userId` (settings store keyPath `[userId, key]`).
- Deletes are tombstones (`deletedAt` set, record retained) so record-level merge/sync slots in later.
- `userId` is always a parameter flowing through the port — never read from a global — so swapping the placeholder for the Google id in ② touches only the identity provider, not storage code.
- Placeholder id: the constant `"local-placeholder"`, defined in one place.
- App startup calls `navigator.storage.persist()`; result is logged, never blocks.
- The adapter shares one lazily opened connection; a failed open is never cached — the next call retries, so a transient failure heals without a reload.

Alternatives: raw IndexedDB API (verbose, error-prone), Dexie (larger abstraction whose query layer we don't need), localStorage (no structure, no room for the record schema).

### D6. Source layout: feature-first folders; CCA enforced by tags, not directories

Directories are organized by feature/ownership, not by CCA layer. Starting layout for this change: `src/settings/` (preference model, cascade, formatters, `SettingsRepository` port and its IndexedDB adapter, settings use case, Settings page), `src/shell/` (navigation frame, landing), and the shared infrastructure every feature would otherwise duplicate — `src/storage/` (record conventions, shared IndexedDB connection), `src/i18n/`, `src/theme/`, `src/app/` (bootstrap, providers, routing). An adapter lives with the feature that owns its port — the settings adapter changes when settings requirements change, so it is settings code; `src/storage/` holds only what every feature's persistence would otherwise duplicate. The boundary test is ownership plus opinion: a file opinionated toward one module's business logic belongs to that module, while unopinionated code designed to be shareable may sit in an infra folder even while it still has a single consumer. A feature folder freely contains files of several layers; what enforces the dependency rule is each file's line-1 `// CCA: <n>` tag (derived from the file's *role* — who depends on it, which way its imports point) plus import-direction review, exactly as AGENTS.md prescribes. Any import is checkable by comparing two numbers; no directory structure is needed for that.

Layer-named top-level folders were considered and rejected on real-world team experience: they invite the misreading that separating directories *is* separating concerns, and they generate churn as files get moved solely to satisfy the layout. Ownership-aligned folders keep handover clean, are legible to new contributors, and let someone work on a feature without understanding the whole app.

### D7. Preference cascade and delivery

The cascade is a layer-1 pure function: `resolvePreferences(accountLocale | null, browserLocale | null, overrides) → effective prefs`, with the built-in fallback (`en`, `1,234.56`, `YYYY-MM-DD`, `dark`) as the last resort. Locale→default mapping (e.g. `id-ID` → language `id`, `1.234,56`; the date default stays ISO `YYYY-MM-DD` for every locale — unambiguous dates matter more in a finance app than local convention, and the user can override) is entity-layer data. `accountLocale` is always `null` in this change but the parameter exists now, so ② plugs in without reshaping the function. A layer-2 use case loads overrides and computes effective prefs; a layer-4 React context applies them (i18next language, `data-theme`, formatter props) and re-renders on change — that's what makes Settings changes immediate.

### D8. Testing: Vitest (+ Testing Library for the thin UI layer)

Vitest shares Vite's config/transform pipeline. Layers 1–2 (cascade, locale mapping, formatters, settings use case with an in-memory repository) get thorough unit tests written alongside the code; UI gets a light smoke test (shell renders, language switch flips a visible string). `fake-indexeddb` covers adapter tests without a browser; each test case gets a fresh database instance (no state shared between tests, no key-space conventions to remember). Alternative: Jest — slower and duplicate config next to Vite.

### D9. Repo hosting & CI: GitHub + GitHub Actions

Already a git repo; GitHub Actions is zero-infrastructure and free at this scale. One workflow on every push: install → lint → typecheck → test → build. Pre-commit ESLint/Prettier per `AGENTS.md` wired with husky + lint-staged in this change (that's what makes `AGENTS.md`'s "run automatically when committing" true). Node pinned via `.nvmrc` (current LTS); npm as package manager (no workspace needs yet). ESLint flat config with `typescript-eslint` strict.

## Risks / Trade-offs

- [Mobile could be reprioritized sooner than Phase Y, and React DOM screens don't run on iOS/Android] → The no-rewrite bound (D1) caps the port to the layer-4 ring, and the thin-component discipline keeps that ring small; if mobile enters the near-term plan, switch the shell to Expo + react-native-web while the UI surface is still small — nothing below layer 4 is affected.
- [CSS Modules token discipline is convention-only; a raw hex can slip in] → Greppable (`#[0-9a-f]` in `*.module.css`); add a lint check later if violations appear — same enforcement posture as the CCA tags.
- [Placeholder `userId` could leak into records that survive into the multi-account era] → Only settings exist before ②, and `plan.md` accepts settings living under a placeholder; the constant is defined once so ② can find every use.
- [IndexedDB data is evictable even after `persist()`] → Accepted for this change; real mitigation is backup (④), which is why it's early in the roadmap.
- [Feature-first folders don't surface dependency-rule violations in the import path itself] → The line-1 CCA tags do: any import is checked by comparing the two files' tags, in review like the rest of the CCA discipline; add a lint rule if violations start slipping through — same posture as the token discipline.

## Migration Plan

Greenfield — nothing to migrate or roll back. Order of operations: scaffold + CI first (so every subsequent commit is checked), then tokens/i18n/storage foundations, then the shell and Settings vertical. The change ends with the manual verification `plan.md` requires: run locally, see the responsive dark shell, switch language/number/date format in Settings, reload, preferences retained.

## Open Questions

- None blocking. The exact set of number-format presets beyond the two separator styles can grow later; the preference is stored as a style identifier so adding presets is additive.
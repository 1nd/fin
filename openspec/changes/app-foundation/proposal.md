# Proposal: app-foundation

## Why

Fin has an overview plan (`openspec/plan.md`) but no code. Every Phase 1 change depends on the foundations this change lays down: a runnable responsive web app shell, the CCA layer layout, persistence behind a swappable adapter, i18n, semantic theme tokens, and the tooling/CI discipline. Establishing these in change ① means every subsequent change inherits them as obligations rather than retrofits.

## What Changes

- Initialize the repository as a TypeScript web app: framework, styling approach, test runner, lint/format hooks, and CI running lint + tests on every push (concrete tech picks are design.md decisions per plan.md).
- Establish the Clean Code Architecture source layout with `// CCA: <n>` layer tags and the dependency rule from the first file.
- Build a responsive application shell (desktop/tablet/phone browser) rendered in the Dark theme via semantic design tokens — components never reference raw colors.
- Set up i18n with English and Indonesian message catalogs; no user-facing string hardcoded in components.
- Implement an IndexedDB persistence adapter behind the layer-4 boundary, keyed by `userId` from day one (a placeholder id until Google Sign-In lands in change ②), with `navigator.storage.persist()` requested. Record shape includes ids and tombstone-friendly deletes per plan.md.
- Implement the preference default cascade (Google locale → browser locale → fallback) as a pure entity-layer function (Google locale source arrives in ②; the cascade handles its absence now).
- Ship a Settings page where the user can view and override language, number format, date format, and theme — each an independent preference, persisted, applied immediately.
- End state is manually verifiable: open the app locally, see the responsive shell in dark theme, switch language and formats in Settings, reload and find them retained.

## Capabilities

### New Capabilities

- `settings`: user preferences — language (en/id), number format, date format, theme — as independent settings with a pure default cascade (account locale → browser locale → fallback), user overrides persisted per user, and immediate application across the UI.
- `app-shell`: the runnable responsive application shell — navigation frame, dark theme via semantic tokens, localized UI strings, and placeholder landing content that later changes replace.

### Modified Capabilities

_None — this is the first change; no main specs exist yet._

## Impact

- **Code**: new repository scaffolding — app source under `src/` in CCA layers, test setup, CI workflow, lint/format config. No existing code is affected (there is none).
- **Dependencies**: introduces the UI framework, styling tooling, i18n library, IndexedDB wrapper, and test runner chosen in design.md.
- **Downstream changes**: ②–⑦ all build on this shell, storage adapter, i18n, tokens, and CI. The storage schema's `userId` keying and tombstone-friendly deletes are load-bearing for ② (sign-in partitions) and ④ (backup/merge).
- **Systems**: CI provider and repo hosting are selected and wired up as part of this change.
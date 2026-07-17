## Why

Code review of PR #4 (`app-foundation`) found four foundation gaps. Three
are silent-failure gaps in the settings preference flow: (1) a preference
change made while the initial stored-preferences load is still in flight
can be reverted when that load resolves with a snapshot predating the
change; (2) a failed override write (`setOverride`) keeps the optimistic UI
but loses the preference on reload with nothing logged and nothing shown —
invisible data loss of an explicit user action; (3) `remove`'s tombstone
write reads a record and writes it back in two separate IndexedDB
transactions, so a concurrent writer that commits in between is silently
lost. The fourth is in the shared storage layer: `src/storage/db.ts` opens
IndexedDB with no `blocked`/`blocking`/`terminated` handlers, so once a
future `DB_VERSION` bump ships, a tab left open on the old version blocks
the new version's upgrade indefinitely — a hang that surfaces the moment
Fin is used in multiple tabs across a schema migration. The user decided
persistence failures of explicit user actions must surface in the UI (not
log-only), that concurrency-safety fixes localized to one method land now
rather than waiting for the problem to occur, and that multi-tab connection
lifecycle be handled now given Fin may be opened in multiple tabs.

## What Changes

- Guard the initial effective-preferences load so it can never revert a
  preference the user changed while the load was in flight; keys touched by
  the user keep their optimistic values, the rest of the loaded snapshot
  still applies.
- Surface failed preference writes: the Settings page shows a visible,
  localized, non-blocking notice (`role="alert"`) while at least one
  preference change has failed to persist; the in-session optimistic state
  is kept (the change still works until reload — only durability failed).
- Clear the notice when a later write for every previously-failed key
  succeeds; log each write failure to the console with the failing key.
- Log (console-only) a failure of the initial stored-preferences load; no
  user-facing notice, since no user action was lost and a "couldn't save"
  message would be wrong for a read failure.
- Make preference removal atomic with respect to concurrent writes: the
  tombstone read and write now share a single IndexedDB `readwrite`
  transaction, so a concurrent `set` can no longer be silently resurrected
  by `remove`'s blind write-back of a stale record.
- Register IndexedDB `blocked`/`blocking`/`terminated` handlers so a tab
  holding an older database version yields its connection when another tab
  needs to upgrade, instead of hanging that upgrade; multiple tabs at the
  same version continue to coexist unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `settings`: add requirements that (a) an in-flight initial load must not
  revert a concurrently-made preference change, (b) a preference change
  that fails to persist is surfaced to the user on the Settings page while
  keeping the in-session value, with the notice clearing after a subsequent
  successful save, and (c) removing a preference override is atomic with
  respect to a concurrent write to the same key.
- `app-shell`: extend the persistent local storage foundation to coordinate
  connection lifecycle across tabs, so a database version upgrade in one
  tab is not blocked indefinitely by another tab holding an older
  connection.

## Impact

- `src/settings/PreferencesContext.tsx` — race guard (overridden-keys
  merge), failed-keys tracking, `persistenceError` exposed on the context,
  rejection handlers on load and write paths.
- `src/settings/SettingsPage.tsx` + `SettingsPage.module.css` — inline
  alert notice using the existing `--color-text-danger` token.
- `src/i18n/resources/en.json`, `src/i18n/resources/id.json` — new
  `settings.saveError` catalog entry (i18n discipline: no hardcoded
  user-facing strings).
- `src/settings/PreferencesContext.test.tsx` — regression tests for the
  race and for surfacing/clearing the failure notice.
- `src/settings/indexeddb/indexedDbSettingsRepository.ts` — `remove` reads
  and tombstone-writes within one `readwrite` transaction instead of two
  independent calls.
- `src/settings/indexeddb/indexedDbSettingsRepository.test.ts` —
  regression test for the concurrent remove/set race.
- `src/storage/db.ts` — `blocked`/`blocking`/`terminated` handlers on
  `openDB`; on `blocking`, close the connection and reset the cached
  promise so the next `getDb()` reopens against the new version.
- `src/storage/db.test.ts` — coverage for the blocking path (a tab yields
  its connection on a version change).
- No storage schema, dependency, or API changes.
## Context

PR #4 (app-foundation) review flagged four foundation gaps:

1. **Initial-load race** (`src/settings/PreferencesContext.tsx`). The
   provider seeds state synchronously from the cascade, then asynchronously
   loads effective preferences (stored overrides applied) and replaces
   state wholesale. A preference set while that load is in flight is
   overwritten by the resolving snapshot, which predates it — the user's
   change visibly reverts until reload. The window is milliseconds on a
   warm IndexedDB but real.
2. **Silent write failure** (same file). `setPreference` fired
   `void useCase.setOverride(...)` with no rejection handling. A failed
   write keeps the optimistic UI for the session but loses the override on
   reload, with nothing logged and nothing shown.
3. **Tombstone read-then-write race**
   (`src/settings/indexeddb/indexedDbSettingsRepository.ts`). `remove` did
   `db.get` then `db.put` as two independent, separately-committing
   IndexedDB transactions. A concurrent writer that commits between them is
   silently overwritten: `remove`'s blind `put` re-commits a record built
   from the stale value it read, resurrecting it. Fin is single-user today,
   but `plan.md`'s storage decisions record tombstone-friendly deletes
   specifically "so record-level merge or server sync slots in later" —
   this is exactly the kind of concurrency the schema is already built to
   survive, so the adapter should be too, and the fix is a single method,
   cheap to make now.
4. **Missing multi-tab connection lifecycle** (`src/storage/db.ts`). `getDb`
   opens IndexedDB with only an `upgrade` handler — no
   `blocked`/`blocking`/`terminated`. At a constant `DB_VERSION`, multiple
   tabs coexist fine; the gap is version upgrades: when a future deploy
   bumps `DB_VERSION` and a tab is still open on the old version, that old
   connection blocks the new tab's upgrade indefinitely, with no `blocking`
   handler to make the old tab yield. Fin is intended to be usable in
   multiple tabs, so this is a real forward-looking hazard that the
   schema-versioning machinery already implies.

During review remediation the first three fixes were implemented directly in
the working tree (provider guard + Settings-page notice + tests, then the
repository transaction fix + test); this change records their requirements
and design retroactively so specs stay the source of truth. The fourth
(multi-tab connection lifecycle) is captured here first and is not yet
implemented — it lands via `/opsx:apply` against the tasks below. Three
posture decisions were made explicitly by the user rather than following the
reviewer's initial suggestions: persistence failures surface in the UI (not
log-only); the concurrency fix lands now rather than being deferred until
multi-user/sync actually ships; and multi-tab lifecycle is handled now given
Fin may be opened in multiple tabs.

## Goals / Non-Goals

**Goals:**

- A concurrently-made preference change survives the initial load
  resolving; the rest of the loaded snapshot still applies.
- A failed preference write is visible to the user where they made the
  change, without blocking further interaction or discarding the
  in-session value.
- The failure indication clears itself once saving works again.
- Every failure path (load and write) leaves a console trace for
  diagnosis.
- A `remove` racing a concurrent `set` (or another `remove`) on the same
  key never resurrects a value the concurrent write already superseded.
- A database version upgrade opened in one tab is not blocked indefinitely
  by another tab still holding a connection at the previous version; tabs
  at the same version continue to coexist unchanged.

**Non-Goals:**

- Retry/queueing of failed writes — the user can re-select the value;
  anything more is machinery the foundation doesn't need yet (if a future
  change needs it, it slots into the provider only).
- A global toast/notification system — not expected in this change; if a
  later change needs app-wide notices, open a discussion there.
- Reverting the optimistic UI on write failure — the in-session state is
  correct (the preference actively works); only durability failed.
- Surfacing initial-load failures in the UI — no user action was lost; the
  app degrades to cascade defaults. Log-only.
- Cross-tab/cross-device coordination beyond single-record atomicity (e.g.
  a merge policy, conflict UI, or last-writer-wins tie-breaking beyond what
  IndexedDB's transaction ordering already gives) — real multi-device sync
  is Phase X's server, not something this adapter should anticipate beyond
  not corrupting data.
- Cross-tab data coordination — live state broadcast between tabs (e.g.
  BroadcastChannel), leader election, or reactive re-read when another tab
  writes. This change handles only connection *lifecycle* so upgrades don't
  hang; keeping two open tabs' in-memory state in lockstep is a separate
  concern, not expected here — open a discussion if a later change needs it.

## Decisions

### D1: Race guard is a per-key optimistic merge, not blanket cancellation

The provider records every key the user touches (`overriddenKeys` ref).
When the initial load resolves, it applies the loaded snapshot via a
functional state update but keeps the current value for every touched key.

- *Alternative — flip the effect's `cancelled` flag in `setPreference`
  (reviewer's sketch):* rejected. Changing one setting (e.g. theme) during
  the load window would discard the entire effective snapshot, so stored
  overrides for untouched keys (e.g. language) would silently not apply
  until reload — trading one stale-data bug for another.
- The functional update reads committed state at merge time, avoiding a
  second stale-closure race.

### D2: Write failures surface in the UI; log-only is reserved for best-effort operations

`setOverride` persists an explicit user action, and persistence is the only
thing `setPreference` does beyond in-memory state. Its failure is data loss
that stays invisible until a later reload — categorically different from
`requestPersistentStorage` (src/storage/persist.ts), whose decline is a
routine, harmless outcome and rightly log-only. The Settings page shows a
localized, non-blocking `role="alert"` notice while any preference change
remains unpersisted.

- *Alternative — `console.warn` matching persist.ts (reviewer's
  suggestion):* rejected by user decision; blurs the line between a
  declined nicety and a lost user action.
- *Alternative — revert the optimistic update:* rejected; it would undo a
  change that works for the session and make the UI lie in the other
  direction.
- The notice renders only on the Settings page — acceptable because that is
  the only surface from which preference writes originate; a failure is
  adjacent to the action that caused it.

### D3: Failure state is a per-key set, exposed as a boolean

The provider tracks `failedKeys: Set<PreferenceKey>`; a rejected write adds
its key (and logs `console.error` with the key), a successful write removes
it. The context exposes only `persistenceError: boolean`
(`failedKeys.size > 0`).

- *Alternative — sticky boolean:* either never clears (permanent scary
  banner after one transient failure) or clears on any success (wrongly,
  while another key's override is still lost). Per-key tracking clears
  exactly when every failed key has since been saved.
- Consumers get a boolean because no current UI needs to know *which* key
  failed; widening the contract later is additive.

### D4: Notice is a localized catalog entry styled by tokens

`settings.saveError` in both `en` and `id` catalogs (i18n discipline: no
hardcoded user-facing strings), styled with the existing
`--color-text-danger` semantic token (no raw colors), `role="alert"` so
assistive tech announces it.

### D5: `remove` reads and tombstone-writes inside one IndexedDB transaction

`remove` now opens a single `readwrite` transaction on the `settings`
store, does `tx.store.get` then `tx.store.put` against that same
transaction, and awaits `tx.done`. IndexedDB serializes overlapping
`readwrite` transactions on a store, so the read-modify-write becomes
atomic relative to any other transaction (another `set`, another `remove`)
on the same store: a concurrent writer either fully commits before this
transaction's read (which then sees the fresh value) or fully after (its
write stands, unclobbered).

- *Alternative — leave it, since Fin is single-user today:* rejected by
  user decision. The corner test in `plan.md` asks that fixes be justified
  against Fin's eventual shape, not its current size, and the tombstone
  schema already exists for record-level merge/sync; fixing the one method
  that touches it now is cheap, whereas finding and diagnosing an
  intermittent resurrection bug after multi-device sync ships would not be.
- *Alternative — optimistic concurrency (version/etag check-and-retry):*
  rejected as more machinery than the problem needs; a single transaction
  already gives atomicity without introducing a retry loop or a version
  field the schema doesn't otherwise need.
- `set` is unaffected — it was already a blind `put` with no prior read, so
  it was already atomic.

### D6: `getDb` registers blocked/blocking/terminated handlers; on blocking it yields the connection

`openDB` gains three handlers. `blocking` (this tab holds a connection that
is blocking another tab's newer-version upgrade) closes the connection and
clears the cached `dbPromise`, so the upgrade proceeds and the next
`getDb()` reopens against the new version. `blocked` (this tab's own open is
blocked by another tab's older connection) and `terminated` (abnormal close)
are logged for diagnosis. Same-version tabs never trigger any of these —
they coexist untouched.

- *Alternative — leave handlers unset:* rejected. The default leaves a
  version upgrade hanging until the user manually finds and closes the stale
  tab, with no signal why the new tab is stuck — and it only appears once a
  migration ships with two tabs open, precisely when it is hardest to
  diagnose.
- *Alternative — reload the page in `blocking`:* rejected as too heavy here;
  closing the connection is the minimal correct action, and a reload/notify
  UX (if wanted) can layer on later without reworking this. Closing plus
  resetting the cached promise leaves the tab able to reopen lazily on its
  next storage access.
- The cached-promise reset reuses the discipline already in `getDb`'s
  failed-open path (a stale promise must never be replayed).

## Risks / Trade-offs

- [Out-of-order settlement: rapid successive writes to the same key may
  resolve in a different order than issued, briefly mis-setting the flag]
  → accepted at foundation scale; the flag converges on the next settled
  write, and the stored value itself is last-write-wins in the repository.
- [Notice is invisible if the user navigates away before a slow failure
  settles] → accepted; the failure remains logged, and any later visit to
  Settings while the key is still unsaved shows the notice.
- [No retry means a persistently failing store shows a notice the user
  can't act on] → acceptable and honest: the message states changes may
  not survive reload; deeper storage-failure UX belongs to a later change
  if it proves needed.
- [The single-transaction fix makes `remove` atomic with respect to other
  transactions on the store, but does not itself define which of two
  simultaneous writes to the *same* key should "win" beyond transaction
  commit order] → accepted; commit order is IndexedDB's own serialization,
  the same implicit tie-break `set` already relies on, and a real
  merge/conflict policy is explicitly Phase X's (server-backed sync)
  concern per `plan.md`, not this adapter's.
- [A tab whose connection is closed by the `blocking` handler reopens at the
  new version on its next `getDb()`, but any in-memory state it already
  rendered from the old version is not proactively refreshed] → accepted;
  this change scopes to not hanging the upgrade, not to live cross-tab state
  refresh (a non-goal above). The reopened connection reads current data on
  the next access.
# Tasks

Note: the implementation landed in the working tree during PR #4 review
remediation, before this change was proposed. Applying this change means
verifying each task against the code (and spec scenarios) rather than
writing it fresh; fix any gaps found.

## 1. Provider: race guard

- [x] 1.1 Track user-touched preference keys in `PreferencesContext` and, when the initial effective-preferences load resolves, merge the loaded snapshot without overwriting touched keys (functional state update)
- [x] 1.2 Regression test: hold the initial load open, change a preference mid-flight, resolve with a predating snapshot; assert the user's value survives and the snapshot's other values apply

## 2. Provider: write-failure tracking

- [x] 2.1 Handle `setOverride` rejection: log `console.error` with the failing key and add the key to a `failedKeys` set; remove the key on a subsequent successful write
- [x] 2.2 Expose `persistenceError: boolean` (`failedKeys.size > 0`) on the preferences context
- [x] 2.3 Handle initial-load rejection with a `console.error` (log-only; no notice)

## 3. Settings page notice

- [x] 3.1 Render a non-blocking `role="alert"` notice on the Settings page while `persistenceError` is set, styled with the `--color-text-danger` token
- [x] 3.2 Add the `settings.saveError` catalog entry to both `en` and `id` resources
- [x] 3.3 Regression test: with `setOverride` rejecting, change a preference and assert the localized alert appears, the chosen value is kept, and the failure is logged with the key; flip the mock to succeed, save again, and assert the alert clears

## 4. Verification

- [x] 4.1 Full suite green: `npm run typecheck && npm run lint && npm test`
- [x] 4.2 Manual check: run the app, open Settings, simulate a write failure (e.g. DevTools → block IndexedDB or mock the repository), confirm the notice appears in the active language and clears after a successful save

## 5. Repository: atomic remove

- [x] 5.1 Make `remove` read and tombstone-write within a single IndexedDB `readwrite` transaction (`tx.store.get` → `tx.store.put` → `tx.done`) instead of two independent `db.get`/`db.put` calls
- [x] 5.2 Regression test: race `remove` against a concurrent `set` on the same key; assert the stored record reflects the `set`'s value, never the pre-race value

## 6. Storage: multi-tab connection lifecycle

- [x] 6.1 Register `blocked`/`blocking`/`terminated` handlers on `openDB` in `src/storage/db.ts`; on `blocking`, close the connection and reset the cached `dbPromise` so the next `getDb()` reopens against the new version; log `blocked` and `terminated` for diagnosis
- [x] 6.2 Test: a connection held open while another tab opens the database at a higher version is closed (yields) so the upgrade completes; verify same-version opens are not disturbed

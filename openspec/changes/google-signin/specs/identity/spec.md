## ADDED Requirements

### Requirement: Identity required before app views render

The system SHALL require a signed-in Google identity before rendering any app view. While no identity is present, the system SHALL render a localized sign-in screen and SHALL NOT render Home, Settings, or any other app view or the shell's authenticated chrome. All sign-in screen text SHALL come from the message catalogs (English and Indonesian).

#### Scenario: Signed-out visitor sees the sign-in screen

- **WHEN** the app is opened with no signed-in identity
- **THEN** the localized sign-in screen renders and no app view or authenticated shell chrome is shown

#### Scenario: Sign-in screen is localized

- **WHEN** the browser locale is Indonesian and no identity is present
- **THEN** the sign-in screen renders entirely from the Indonesian catalog with no hardcoded or leftover English strings

### Requirement: Sign-in preserves the intended destination

A signed-out visit to any addressable URL SHALL keep the **full requested URL** — path, query string, and hash fragment — intact (no redirect) while the sign-in screen is shown, and upon successful sign-in the originally requested view SHALL render at that same URL with its query and hash preserved.

#### Scenario: Signing in lands on the originally requested view

- **WHEN** a signed-out user navigates directly to `/settings` and completes sign-in
- **THEN** the full requested URL remains `/settings` throughout and the Settings view renders after sign-in, with no redirect to another path

#### Scenario: Query string and hash survive sign-in

- **WHEN** a signed-out user opens an addressable URL carrying a query string and a hash fragment, then completes sign-in
- **THEN** the query string and hash fragment are still present on the URL after sign-in and available to the rendered view — the sign-in flow drops neither

### Requirement: Google Sign-In in the browser without a server

The system SHALL authenticate the user through Google Sign-In entirely in the browser using a popup/embedded flow with no redirect URIs and no server exchange. On success the system SHALL derive a stable `userId` from the Google account's subject identifier and SHALL capture the account's display name, email, profile picture, and locale claim (when present) for display and preference defaults.

#### Scenario: Successful sign-in establishes the user

- **WHEN** the user completes Google Sign-In
- **THEN** the app resolves a stable `userId` from the Google account and renders the app as that user

#### Scenario: Failed sign-in keeps the user on the gate with a notice

- **WHEN** Google Sign-In fails — the returned token is rejected (audience, issuer, expiry, or subject), or the sign-in script or configuration fails to load
- **THEN** no identity is established, the sign-in screen remains with a localized notice, and no app view renders

#### Scenario: A failed sign-in offers a way to retry without a reload

- **WHEN** Google Sign-In fails before the sign-in affordance itself ever rendered (e.g. the sign-in script failed to load) — a rejected token is excluded here, since it leaves the real affordance rendered and already clickable again
- **THEN** the sign-in screen offers a retry control, since there is otherwise nothing on screen for the user to act on

#### Scenario: A dismissed sign-in prompt leaves the gate unchanged

- **WHEN** the user closes the Google account chooser without completing sign-in
- **THEN** no identity is established and the sign-in screen remains exactly as it was — Google Identity Services gives the app no signal for a bare dismissal, so no notice is shown, and the sign-in affordance remains usable for another attempt

### Requirement: Signed-in account presented with sign-out

The system SHALL present the signed-in account (at minimum its name or email) within the shell and SHALL provide a control to sign out. Signing out SHALL clear the active identity and return the app to the sign-in screen. Sign-out SHALL be an explicit in-page gesture, not a URL that performs the side effect on visit.

#### Scenario: Signed-in account is shown

- **WHEN** a user is signed in
- **THEN** the shell displays that account's name or email and a sign-out control

#### Scenario: Signing out returns to the gate

- **WHEN** a signed-in user activates the sign-out control
- **THEN** the active identity is cleared and the sign-in screen is shown again

### Requirement: Accounts are separate data partitions

The system SHALL treat each distinct Google account as a distinct user whose per-user storage is fully partitioned by its `userId`: data written while signed in as one account SHALL NOT be visible while signed in as another. Signing in as a different Google account SHALL switch the app to that account's partition.

#### Scenario: A second account sees its own partition

- **WHEN** a user signs out and then signs in with a different Google account on the same browser
- **THEN** the app operates under the second account's `userId` and none of the first account's per-user data is shown

#### Scenario: A second user tries Fin on the same browser

- **WHEN** a second user signs in with their own Google account on a browser where the first user was previously signed in
- **THEN** the app operates under the second user's `userId` with no visibility into the first user's data, and the first user's data remains intact, unaffected and ready to resume when the first user signs back in

### Requirement: Session persists and restores across reload

The system SHALL persist the established identity locally so that reloading the browser restores the signed-in session without re-authenticating. Signing out SHALL remove the persisted session. In Phase 1 the restored session is identity convenience, not a security boundary.

#### Scenario: Reload keeps the user signed in

- **WHEN** a signed-in user reloads the browser
- **THEN** the app restores the same identity and renders the app view without showing the sign-in screen

#### Scenario: After sign-out a reload shows the gate

- **WHEN** a user signs out and then reloads the browser
- **THEN** no session is restored and the sign-in screen is shown

### Requirement: Per-user storage keyed by the signed-in userId

The system SHALL key all per-user storage reads and writes by the currently signed-in `userId`, replacing the placeholder id used before this change. No app view that reads or writes per-user data SHALL run without a signed-in `userId`.

#### Scenario: Preferences are stored under the signed-in userId

- **WHEN** a signed-in user changes a preference
- **THEN** the preference is persisted under that user's Google `userId`, not under any placeholder id
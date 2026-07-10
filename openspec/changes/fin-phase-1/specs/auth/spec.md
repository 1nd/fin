## ADDED Requirements

### Requirement: Google Sign-In

The system SHALL allow a user to authenticate using their Google account via a client-side Google Sign-In flow, with no separate registration step required.

#### Scenario: First-time sign in

- **WHEN** an unauthenticated user opens Fin and completes the Google Sign-In flow successfully
- **THEN** the system creates a local session for that user and grants access to the app

#### Scenario: Returning user sign in

- **WHEN** a previously signed-in user opens Fin and their session is still valid
- **THEN** the system restores their session without requiring them to sign in again

#### Scenario: Sign-in failure

- **WHEN** the Google Sign-In flow fails or is cancelled by the user
- **THEN** the system keeps the user on an unauthenticated, signed-out state and does not grant access to the app

### Requirement: Stable per-user identifier

The system SHALL derive a stable user identifier from the authenticated Google account and use it to key all locally stored data belonging to that user.

#### Scenario: Identifier derivation

- **WHEN** a user completes Google Sign-In
- **THEN** the system derives a stable identifier (e.g. the Google account's unique subject identifier) and associates all subsequently created or read records with that identifier

#### Scenario: Same account, multiple sign-ins

- **WHEN** the same Google account signs in again on the same browser after signing out
- **THEN** the system resolves to the same stable identifier and the user sees the same previously stored data

### Requirement: Sign-in is not a data security boundary

The system SHALL treat Google Sign-In in Phase 1 as an access convenience only, not as protection for locally stored data, and MUST NOT represent it to users as securing their data from others with access to the same browser profile.

#### Scenario: Local data accessible without re-authentication

- **WHEN** a user is signed out but their browser profile still holds previously written local data
- **THEN** the system does not claim that data is inaccessible to others using the same browser profile

### Requirement: Sign out

The system SHALL allow a signed-in user to sign out, ending their local session without deleting their locally stored data.

#### Scenario: User signs out

- **WHEN** a signed-in user chooses to sign out
- **THEN** the system ends the local session and returns the user to an unauthenticated state, while preserving their previously stored data for the next sign-in

### Requirement: Switching accounts does not leak data between users

The system SHALL ensure that when a different Google account signs in on the same browser after a previous account's session has ended, no data belonging to the previous account remains visible in the UI — whether from in-memory application state or a stale render — before the newly signed-in account's own data (or an appropriate empty state) has loaded.

#### Scenario: Switching to a different account on the same browser

- **WHEN** a user signs out and a different Google account signs in on the same browser, where both accounts have previously stored local data
- **THEN** the system does not display any of the previous account's categories, entries, or other data at any point during or after the new account's sign-in

#### Scenario: In-memory state is cleared on sign-out

- **WHEN** a user signs out
- **THEN** the system clears all in-memory application state derived from that user's data, rather than retaining it until overwritten by the next sign-in's data

#### Scenario: Switching to an account with no local data

- **WHEN** a user signs out and a different Google account with no previously stored local data signs in on the same browser
- **THEN** the system shows that account's empty state, not any residual data from the previous account

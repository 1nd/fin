## ADDED Requirements

### Requirement: Platform-aware repository abstraction

The system SHALL access all persisted data (categories and entries) through a repository interface that is not directly coupled to a specific storage engine, so that the underlying storage implementation can be substituted per platform without changing calling code.

#### Scenario: Web storage implementation

- **WHEN** Fin runs in a web browser
- **THEN** the repository implementation persists data using IndexedDB

#### Scenario: Calling code is storage-agnostic

- **WHEN** application code (e.g. category or entry management features) reads or writes data
- **THEN** it does so exclusively through the repository interface, without directly referencing IndexedDB or any other storage-engine-specific API

### Requirement: Data keyed by user identifier

The system SHALL scope all locally stored records (categories and entries) to the stable user identifier of the currently signed-in user.

#### Scenario: Records scoped to signed-in user

- **WHEN** a signed-in user creates a category or entry
- **THEN** the system persists it tagged with that user's stable identifier

#### Scenario: Reading only returns the current user's data

- **WHEN** a user is signed in and the app reads categories or entries
- **THEN** the system returns only records tagged with that user's stable identifier

### Requirement: Data persists across sessions

The system SHALL persist categories and entries in local browser storage such that they remain available across page reloads and browser restarts, without requiring a network connection.

#### Scenario: Data survives reload

- **WHEN** a user creates categories and entries, then reloads the page
- **THEN** the previously created categories and entries are still present

#### Scenario: Data available offline

- **WHEN** a user opens Fin without a network connection, having previously used it on the same browser
- **THEN** the system loads their previously stored categories and entries from local storage

### Requirement: Storage access retries after a transient failure

The system SHALL NOT permanently fail data access for the remainder of a session after a single transient failure to open local storage.

#### Scenario: A later operation retries after a failed open

- **WHEN** the underlying storage engine fails to open (e.g. a transient browser restriction or a blocked upgrade)
- **THEN** the failure is surfaced to that operation, but a subsequent read or write attempt tries to open storage again rather than reusing the earlier failure

#### Scenario: Storage connection lost mid-session

- **WHEN** the storage connection is closed out from under the app while it is open (e.g. abnormal termination by the browser, or released so another tab can upgrade the schema)
- **THEN** a subsequent read or write attempt opens a fresh connection rather than reusing the lost one

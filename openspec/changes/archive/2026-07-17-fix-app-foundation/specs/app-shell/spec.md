# app-shell (delta)

## ADDED Requirements

### Requirement: Storage connection lifecycle across tabs
The system SHALL coordinate its IndexedDB connection lifecycle across concurrently open tabs so that a database version upgrade requested by one tab is not blocked indefinitely by another tab holding a connection at an older version. A tab holding a connection that blocks another tab's upgrade SHALL yield that connection (close it) so the upgrade proceeds; tabs open at the same database version SHALL continue to operate without interruption.

#### Scenario: An open tab yields its connection to a newer-version upgrade
- **WHEN** one tab holds an open database connection and another tab opens the database at a higher version
- **THEN** the holding tab closes its connection so the upgrade completes, and the holding tab reopens against the new version on its next storage access

#### Scenario: Same-version tabs coexist
- **WHEN** multiple tabs open the database at the same version
- **THEN** all tabs operate on their connections without any being closed or blocked

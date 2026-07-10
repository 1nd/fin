## ADDED Requirements

### Requirement: Drive backup permission

The system SHALL request an incremental Google Drive OAuth scope limited to files the app itself creates (`drive.file`) as part of or following Google Sign-In, and SHALL NOT request broader access to the user's Drive.

#### Scenario: Scope granted during sign-in

- **WHEN** a user completes Google Sign-In
- **THEN** the system has obtained a Drive scope sufficient to create and update a backup file, without access to the user's other Drive files

### Requirement: Automatic backup after write activity settles

The system SHALL automatically back up the signed-in user's categories and entries to Google Drive shortly after write activity (creating, editing, or deleting a category or entry) settles, without requiring the user to manually trigger it.

#### Scenario: Backup runs after a quiet period following changes

- **WHEN** a signed-in user creates, edits, or deletes a category or entry, and no further such change occurs for a short quiet period (on the order of 1-2 minutes)
- **THEN** the system performs a backup to Google Drive while the app remains open

#### Scenario: Rapid successive changes do not each trigger a separate backup

- **WHEN** a signed-in user makes several changes in quick succession
- **THEN** the system waits until the changes settle into a quiet period before performing a single backup, rather than backing up after every individual change

#### Scenario: No backup when nothing has changed

- **WHEN** a signed-in user has made no changes since their last successful backup
- **THEN** the system does not perform a redundant backup

### Requirement: Backup on sign-out

The system SHALL perform a backup to Google Drive when the user signs out if any changes have occurred since the last successful backup.

#### Scenario: Backup triggered by sign-out

- **WHEN** a signed-in user signs out, and changes have occurred since the last successful backup
- **THEN** the system performs a backup to Google Drive before or as part of ending the session

#### Scenario: No redundant backup on sign-out

- **WHEN** a signed-in user signs out immediately after a backup has already completed with no changes in between
- **THEN** the system does not perform a second, redundant backup

### Requirement: Backup overwrites a single file

The system SHALL maintain a single backup file per user in Google Drive, updating (overwriting) that same file on each backup run rather than creating a new file per run.

#### Scenario: Repeated backups update the same file

- **WHEN** a second automatic backup runs after a first backup has already created a file in Drive
- **THEN** the system updates the existing backup file rather than creating an additional one

### Requirement: Backup failures are non-blocking

The system SHALL continue to allow normal use of the app when a backup attempt fails, and SHALL NOT block or degrade any other functionality due to a failed backup.

#### Scenario: App remains usable after a failed backup

- **WHEN** a backup attempt fails (e.g. due to no network connection or revoked Drive permission)
- **THEN** the user can continue creating, editing, and viewing categories and entries without interruption

### Requirement: Last backup status is visible

The system SHALL display the timestamp and outcome (success or failure) of the most recent backup attempt in Settings.

#### Scenario: Viewing backup status

- **WHEN** a user opens Settings
- **THEN** the system shows the date/time of the last backup attempt and whether it succeeded or failed

### Requirement: Automatic restore offer on sign-in with no local data

The system SHALL, when a user signs in and no local data exists for that user in the browser, check for an existing Drive backup file and offer to restore it.

#### Scenario: Backup found on a fresh browser

- **WHEN** a user signs in on a browser with no existing local data for their account, and a Drive backup file exists for that account
- **THEN** the system offers to restore the data from that backup before the user proceeds to an empty app

#### Scenario: No backup found

- **WHEN** a user signs in on a browser with no existing local data for their account, and no Drive backup file exists for that account
- **THEN** the system proceeds without offering a restore

### Requirement: Manual restore

The system SHALL allow a signed-in user to trigger a restore from their Drive backup at any time from Settings, regardless of whether local data currently exists.

#### Scenario: Manual restore with existing local data

- **WHEN** a user triggers restore from Settings while local data already exists
- **THEN** the system requires explicit confirmation before proceeding, warning that current local data will be replaced

#### Scenario: Restore replaces local data

- **WHEN** a user confirms a restore
- **THEN** the system replaces all of that user's local categories and entries with the contents of the Drive backup file

### Requirement: Restore is a full replace, not a merge

The system SHALL treat restore as a full replacement of local data with the contents of the Drive backup file, and SHALL NOT attempt to merge or reconcile existing local data with the backup.

#### Scenario: Local data discarded on restore

- **WHEN** a restore is confirmed and local data exists that differs from the Drive backup
- **THEN** the system discards the differing local data entirely and loads the backup's contents in its place

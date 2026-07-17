# settings (delta)

## ADDED Requirements

### Requirement: Concurrent preference changes survive the initial load
The system SHALL ensure that resolving the initial stored-preferences load never reverts a preference the user changed while that load was in flight: each preference key changed by the user SHALL keep the user's value, while loaded values for untouched keys SHALL still apply.

#### Scenario: Change made during the load keeps the user's value
- **WHEN** the user changes the language before the initial stored-preferences load resolves, and the load then resolves with a snapshot predating that change
- **THEN** the language remains the user's chosen value

#### Scenario: Loaded overrides for untouched keys still apply
- **WHEN** the user changes only the language before the initial load resolves, and the resolving snapshot carries a stored date-format override
- **THEN** the stored date-format override applies while the language keeps the user's chosen value

### Requirement: Failed preference persistence is surfaced to the user
The system SHALL detect when persisting a preference change fails and SHALL display a visible, localized, non-blocking notice on the Settings page (announced to assistive technology) while at least one preference change remains unpersisted. The in-session preference value SHALL be kept — the change continues to apply until reload. The system SHALL NOT block or revert further preference changes while the notice is shown. Each write failure SHALL also be logged to the console with the failing preference key.

#### Scenario: Write failure shows a notice and keeps the chosen value
- **WHEN** the user changes the date format and the write to local storage fails
- **THEN** the Settings page shows a localized notice that the change may not survive reload, the date format remains the user's chosen value, and the failure is logged with the failing key

#### Scenario: Notice clears after saving works again
- **WHEN** every preference change that previously failed to persist has since been saved successfully
- **THEN** the Settings page no longer shows the persistence-failure notice

#### Scenario: Notice persists while any key remains unsaved
- **WHEN** a language change failed to persist and a subsequent theme change is saved successfully
- **THEN** the persistence-failure notice remains visible

### Requirement: Preference load failure degrades to defaults
The system SHALL handle a failure of the initial stored-preferences load by logging it to the console and continuing with cascade-derived preference values; the system SHALL NOT display the save-failure notice for a load failure.

#### Scenario: Load failure keeps the app usable
- **WHEN** the initial stored-preferences load fails
- **THEN** the failure is logged, the UI renders with cascade-derived defaults, and no save-failure notice is shown

### Requirement: Preference removal is atomic with respect to concurrent writes
The system SHALL ensure that removing a preference override never loses a concurrent write to the same key: the tombstone read and write SHALL execute within a single atomic storage transaction so a write that commits during the removal is never overwritten by the removal's own write-back of a stale value.

#### Scenario: A concurrent set is not resurrected by a racing remove
- **WHEN** a preference override is removed and a new value for the same key is set concurrently
- **THEN** the stored record reflects the concurrent set's value, not the value that existed before the race
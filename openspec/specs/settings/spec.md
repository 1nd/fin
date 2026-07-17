# settings

## Purpose

TBD — captures user preferences (language, number format, date format, theme): their independence, supported values, default cascade, per-user persistence, and the Settings page that lets users view and change them immediately.

## Requirements

### Requirement: Independent user preferences
The system SHALL maintain four user preferences — language, number format, date format, and theme — as independent settings: changing one SHALL NOT alter any other.

#### Scenario: Language change leaves formats untouched
- **WHEN** the user changes the language from English to Indonesian while number format is `1.234,56` and date format is `DD-MM-YYYY`
- **THEN** the UI language becomes Indonesian and the number and date formats remain `1.234,56` and `DD-MM-YYYY`

### Requirement: Supported preference values
The system SHALL offer exactly these values in Phase 1: language `en` or `id`; number format as a decimal/thousand separator pair (at minimum `1,234.56` and `1.234,56` styles); date format `YYYY-MM-DD` (ISO 8601), `DD-MM-YYYY`, or `MM-DD-YYYY`; theme `dark`. Times SHALL always be displayed in 24-hour format with no user preference for 12-hour display.

#### Scenario: Date format options
- **WHEN** the user opens the date format preference in Settings
- **THEN** exactly the options `YYYY-MM-DD`, `DD-MM-YYYY`, and `MM-DD-YYYY` are offered

#### Scenario: No 12-hour time option
- **WHEN** the user inspects Settings for a time format preference
- **THEN** no 12-hour/24-hour choice exists and any displayed time uses 24-hour format

### Requirement: Default cascade
The system SHALL derive each preference's default by a pure function evaluating, in order: account locale (absent until Google Sign-In lands), then browser locale, then a built-in fallback. A stored user override SHALL always take precedence over the cascade. The date format default SHALL be `YYYY-MM-DD` (ISO 8601) for every locale — locale determines only the language and number format defaults.

#### Scenario: Browser locale supplies defaults before sign-in exists
- **WHEN** a user with no stored overrides and an Indonesian browser locale opens the app
- **THEN** defaults resolve from the browser locale (language `id`, number format `1.234,56`) with date format `YYYY-MM-DD`

#### Scenario: Fallback when locale is unrecognized
- **WHEN** a user with no stored overrides has a browser locale the app does not recognize
- **THEN** the built-in fallback defaults apply and the app renders normally

#### Scenario: Override beats cascade
- **WHEN** a user whose browser locale is Indonesian has stored a language override of `en`
- **THEN** the UI renders in English

### Requirement: Preferences persist per user
The system SHALL persist preference overrides in local storage keyed by `userId` (a placeholder id until sign-in lands), so they survive reload and remain partitioned per user.

#### Scenario: Preferences survive reload
- **WHEN** the user sets language to `id` and date format to `DD-MM-YYYY`, then reloads the app
- **THEN** the UI renders in Indonesian with dates formatted `DD-MM-YYYY`

#### Scenario: Stored under the owning user's id
- **WHEN** a preference override is written to storage
- **THEN** the stored record is keyed by the current `userId`

### Requirement: Settings page applies changes immediately
The system SHALL provide a Settings page where the user can view current effective preferences and change any of them, with changes applied across the UI immediately — no reload or save button required.

#### Scenario: Immediate language switch
- **WHEN** the user selects Indonesian on the Settings page
- **THEN** all visible UI text switches to Indonesian without a reload

#### Scenario: Effective values shown
- **WHEN** the user opens the Settings page without having overridden anything
- **THEN** each preference shows its cascade-derived effective value

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
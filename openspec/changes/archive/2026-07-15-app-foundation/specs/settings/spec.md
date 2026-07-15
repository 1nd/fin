# settings — delta spec (app-foundation)

## ADDED Requirements

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

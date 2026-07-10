## ADDED Requirements

### Requirement: UI language selection, independent of formatting

The system SHALL provide user-facing text in either English or Indonesian, independent of the active number format and date format preferences.

#### Scenario: Indonesian language

- **WHEN** Indonesian is the active language
- **THEN** the system displays UI text in Indonesian, regardless of the active number format or date format

#### Scenario: English language

- **WHEN** English is the active language
- **THEN** the system displays UI text in English, regardless of the active number format or date format

### Requirement: Number format selection, independent of language

The system SHALL format numbers (thousands separator, decimal separator, digit grouping) according to an independently selectable number format preference, distinct from the UI language.

#### Scenario: Indonesian number format

- **WHEN** the Indonesian number format is active
- **THEN** the system formats numbers using Indonesian conventions (e.g. `.` as the thousands separator, `,` as the decimal separator), regardless of the active UI language

#### Scenario: Number format independent of language

- **WHEN** a user has English selected as their UI language and Indonesian selected as their number format
- **THEN** the system displays UI text in English while formatting numbers using Indonesian conventions

### Requirement: Date format selection, limited to three fixed options

The system SHALL allow the user to select a date format from exactly three options — `YYYY-MM-DD` (ISO 8601), `DD-MM-YYYY`, and `MM-DD-YYYY` — independent of the UI language and number format, and SHALL NOT offer any other date format.

#### Scenario: Only three date formats are offered

- **WHEN** a user views the date format options
- **THEN** the system offers exactly `YYYY-MM-DD`, `DD-MM-YYYY`, and `MM-DD-YYYY`, and no other choices

#### Scenario: Date format independent of the other preferences

- **WHEN** a user has different selections for UI language, number format, and date format
- **THEN** the system applies each of the three independently, with none of them affecting the others

### Requirement: Time is always displayed in 24-hour format

The system SHALL display all times in 24-hour format, and SHALL NOT offer a 12-hour format option in Phase 1.

#### Scenario: Time shown in 24-hour format regardless of other preferences

- **WHEN** the system displays a time (e.g. the last backup timestamp in Settings)
- **THEN** it is shown in 24-hour format, regardless of the active language, number format, or date format

### Requirement: Each preference's initial value is seeded once from a fallback chain, then read directly from Settings

The system SHALL determine the initial value of each of the language, number format, and date format preferences — at the point a user's Settings are first created — using a fallback chain specific to that preference: the user's Google account locale if it can be determined, otherwise the browser's locale if it can be determined, otherwise a fixed default for that preference. Once a value exists in Settings for a preference, whether placed there by this fallback or by explicit user choice, the system SHALL read and use that stored value directly, without re-deriving it from the Google account or browser locale again.

#### Scenario: Language fallback chain and final default

- **WHEN** a user's Settings are initialized and no language has been explicitly chosen
- **THEN** the system seeds the language preference from the user's Google account locale if determinable, otherwise the browser locale if determinable, otherwise English

#### Scenario: Number format fallback chain and final default

- **WHEN** a user's Settings are initialized and no number format has been explicitly chosen
- **THEN** the system seeds the number format preference from the user's Google account locale if determinable, otherwise the browser locale if determinable, otherwise the Indonesian number format

#### Scenario: Date format fallback chain and final default

- **WHEN** a user's Settings are initialized and no date format has been explicitly chosen
- **THEN** the system seeds the date format preference from the user's Google account locale if determinable, otherwise the browser locale if determinable, otherwise `YYYY-MM-DD`

#### Scenario: Stored Settings value is authoritative afterward

- **WHEN** a preference already has a value in Settings, regardless of whether it was seeded by the fallback chain or set explicitly by the user
- **THEN** the system uses that stored value for all rendering, and does not re-evaluate the Google account or browser locale for that preference again

### Requirement: Manual override in Settings, per preference

The system SHALL allow a user to independently select their preferred UI language, number format, and date format from a Settings/Account page, with each override affecting only that one preference.

#### Scenario: Changing one preference leaves the others unchanged

- **WHEN** a user changes their number format in Settings
- **THEN** the system updates number formatting immediately while leaving the UI language and date format exactly as they were

#### Scenario: Choices persist across sessions

- **WHEN** a user has set explicit values for any of the three preferences
- **THEN** the system remembers each of those choices for future sessions

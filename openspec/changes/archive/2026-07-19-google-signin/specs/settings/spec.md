## MODIFIED Requirements

### Requirement: Default cascade
The system SHALL derive each preference's default by a pure function evaluating browser locale, then a built-in fallback. A stored user override SHALL always take precedence over the cascade. The date format default SHALL be `YYYY-MM-DD` (ISO 8601) for every locale — locale determines only the language and number format defaults. (An account-locale tier ahead of browser locale — "absent until Google Sign-In lands" — was dropped rather than activated: Google no longer issues the `locale` claim; see the google-signin design, D10.)

#### Scenario: Browser locale supplies defaults
- **WHEN** a signed-in user with no stored overrides has an Indonesian browser locale
- **THEN** defaults resolve from the browser locale (language `id`, number format `1.234,56`) with date format `YYYY-MM-DD`

#### Scenario: Fallback when locale is unrecognized
- **WHEN** a user with no stored overrides has no browser locale the app recognizes
- **THEN** the built-in fallback defaults apply and the app renders normally

#### Scenario: Override beats cascade
- **WHEN** a signed-in user with an Indonesian browser locale has stored a language override of `en`
- **THEN** the UI renders in English

### Requirement: Preferences persist per user
The system SHALL persist preference overrides in local storage keyed by the signed-in user's Google `userId`, so they survive reload and remain partitioned per user; a different signed-in account resolves to a different partition.

#### Scenario: Preferences survive reload
- **WHEN** the user sets language to `id` and date format to `DD-MM-YYYY`, then reloads the app
- **THEN** the UI renders in Indonesian with dates formatted `DD-MM-YYYY`

#### Scenario: Stored under the owning user's id
- **WHEN** a preference override is written to storage
- **THEN** the stored record is keyed by the currently signed-in `userId`

#### Scenario: Different accounts see different preferences
- **WHEN** a preference override set while signed in as one Google account is read after switching to a different Google account
- **THEN** the second account does not see the first account's override and resolves its own cascade-derived value
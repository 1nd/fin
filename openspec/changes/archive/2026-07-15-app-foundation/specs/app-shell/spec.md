# app-shell — delta spec (app-foundation)

## ADDED Requirements

### Requirement: Runnable responsive shell
The system SHALL ship a locally runnable web application shell that lays out correctly on desktop, tablet, and phone browser viewports, with navigation to the Settings page and placeholder landing content that later changes replace.

#### Scenario: Phone-width rendering
- **WHEN** the app is opened in a phone-sized viewport (e.g. 375px wide)
- **THEN** the shell renders without horizontal scrolling and navigation remains usable

#### Scenario: Navigate to Settings
- **WHEN** the user activates the Settings entry in the shell navigation
- **THEN** the Settings page is displayed

### Requirement: Theming via semantic tokens
The system SHALL render all UI through semantic design tokens; components SHALL NOT reference raw color values. Phase 1 SHALL ship the Dark theme as the sole token set, and meaning SHALL never be encoded by color alone.

#### Scenario: Dark theme by default
- **WHEN** the app is opened fresh
- **THEN** the shell renders in the Dark theme sourced from the token set

#### Scenario: No raw colors in components
- **WHEN** component styles are inspected
- **THEN** every color is expressed via a semantic token reference, not a literal color value

### Requirement: All UI text localized
The system SHALL source every user-facing string from a message catalog, with English and Indonesian catalogs provided; no user-facing string SHALL be hardcoded in a component.

#### Scenario: Complete Indonesian rendering
- **WHEN** the effective language is Indonesian
- **THEN** all shell and Settings text renders from the Indonesian catalog with no English strings left over

### Requirement: Persistent local storage foundation
The system SHALL persist data in browser storage behind a swappable adapter boundary, with every record keyed by `userId` and carrying a record id, and deletes expressed tombstone-friendly. On startup the system SHALL request persistent storage from the browser (`navigator.storage.persist()`).

#### Scenario: Persistence requested at startup
- **WHEN** the app starts in a browser that supports the Storage API
- **THEN** persistent storage is requested and the outcome does not block app startup

#### Scenario: Records carry owner and id
- **WHEN** any record is written through the storage adapter
- **THEN** the stored record includes a record id and the owning `userId`
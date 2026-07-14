## ADDED Requirements

### Requirement: Navigation adapts to viewport width

The system SHALL present its primary navigation in a layout appropriate to the viewport width: a sidebar (left tab bar) at widths of 768px or more, and a bottom tab bar below 768px, with each destination showing an icon and a label in both layouts.

#### Scenario: Desktop browser width

- **WHEN** the app is viewed at a viewport width of 768px or more
- **THEN** primary navigation renders as a sidebar and screen content renders in a centered, max-width column

#### Scenario: Phone browser width

- **WHEN** the app is viewed at a viewport width below 768px
- **THEN** primary navigation renders as a bottom tab bar and screen content uses the full viewport width

#### Scenario: Viewport crosses the breakpoint

- **WHEN** the viewport is resized across the 768px breakpoint (e.g. rotating a device or resizing a browser window)
- **THEN** the navigation layout switches accordingly without losing the current route

### Requirement: Navigation chrome uses theme tokens

The system SHALL style all navigation chrome (tab bar or sidebar, headers) from the active theme's tokens, consistent with the theming capability — no default (unthemed) navigator styling is shown.

#### Scenario: Tab bar rendered against Dark theme

- **WHEN** the navigation chrome renders while the Dark theme is active
- **THEN** its background, active/inactive item colors, and borders come from the Dark theme's tokens

### Requirement: Destructive actions require confirmation

The system SHALL require explicit user confirmation before performing any destructive action (an action that deletes or irreversibly replaces user data, e.g. deleting a category or restoring a backup over existing data).

#### Scenario: User initiates a destructive action

- **WHEN** the user triggers a destructive action
- **THEN** the system presents a confirmation dialog describing the consequence, and performs the action only if the user confirms

#### Scenario: User cancels a destructive action

- **WHEN** the user declines the confirmation dialog
- **THEN** no data is modified

### Requirement: Data screens present loading, empty, and error states

The system SHALL give every screen that loads persisted data distinct presentations for loading (while data is being read), empty (loaded successfully with nothing to show, including guidance on how to add data where applicable), and error (loading or a subsequent operation failed).

#### Scenario: Data is loading

- **WHEN** a data-backed screen has not yet finished reading its data
- **THEN** a loading indicator is shown rather than a blank or partial view

#### Scenario: No data exists

- **WHEN** a data-backed screen loads successfully and there is nothing to display
- **THEN** an empty state is shown that tells the user what this screen will contain and, where applicable, how to add their first item

#### Scenario: An operation fails

- **WHEN** loading or a user-initiated operation on a data-backed screen fails
- **THEN** an error presentation is shown to the user rather than a silent failure or a blank view

### Requirement: Errors shown to users are human-readable and localized

The system SHALL present errors to users as translated, human-readable messages in the user's selected language; raw exception messages, stack traces, or error codes SHALL NOT be rendered as the user-facing message.

#### Scenario: A domain or storage error reaches the UI

- **WHEN** an operation fails with an internal error (e.g. a validation rule or a storage failure)
- **THEN** the user sees a translated message describing what went wrong in plain language, not the raw exception text

## ADDED Requirements

### Requirement: Token-based theme architecture

The system SHALL render all UI surfaces using values sourced from a theme (design tokens for color, spacing, and typography) provided through a central theme provider, rather than hard-coded style values scattered across components.

#### Scenario: Component consumes theme tokens

- **WHEN** a UI component needs a color, spacing, or typography value
- **THEN** it obtains that value from the active theme provided by the theme provider, not from a literal hard-coded in the component

### Requirement: Dark theme available

The system SHALL provide a Dark theme as the default and only theme in Phase 1.

#### Scenario: App renders in Dark theme

- **WHEN** a user opens Fin
- **THEN** the app renders using the Dark theme's tokens

### Requirement: Theme system supports adding new themes without restructuring

The system SHALL be structured so that a new theme (e.g. Light, colorblind-friendly) can be introduced by registering a new set of tokens, without requiring changes to how individual components consume theme values.

#### Scenario: Registering an additional theme

- **WHEN** a new theme's token set is added to the theme provider's registry
- **THEN** existing components render correctly under the new theme without code changes to those components

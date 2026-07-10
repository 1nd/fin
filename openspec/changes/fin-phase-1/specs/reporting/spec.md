## ADDED Requirements

### Requirement: Net worth over time view

The system SHALL display the user's net worth (total assets minus total liabilities, converted to the base/reporting currency) as a trend over time, computed from historical balance snapshots.

#### Scenario: Net worth trend reflects snapshot history

- **WHEN** a user has recorded asset and liability snapshots across multiple dates
- **THEN** the system renders a net worth trend showing the computed net worth at each date for which snapshot data exists

#### Scenario: Net worth combines multi-currency holdings

- **WHEN** a user's assets or liabilities include entries recorded in different currencies
- **THEN** the system converts each entry to the base/reporting currency using its stored exchange rate before computing net worth

### Requirement: Category breakdown view

The system SHALL display a breakdown of totals by category (including rolled-up descendant totals) for a selected entity type and time period.

#### Scenario: Breakdown reflects rollups

- **WHEN** a user views the category breakdown for expenses in a given period
- **THEN** each displayed category's value includes its own entries plus all descendant categories' entries for that period

#### Scenario: Uncategorized appears in the breakdown when non-empty

- **WHEN** the "Uncategorized" category holds entries for the selected entity type and period
- **THEN** the breakdown includes it alongside the user's own categories, so its value is neither hidden nor excluded from the total

### Requirement: Income vs. expense trend view

The system SHALL display a trend of total income versus total expenses over time. This requirement is a nice-to-have for Phase 1 and may be deferred to a later iteration without blocking the rest of the reporting capability.

#### Scenario: Income and expense trend rendered

- **WHEN** a user has recorded income and expense entries across multiple periods
- **THEN** the system renders a trend comparing total income to total expenses for each period

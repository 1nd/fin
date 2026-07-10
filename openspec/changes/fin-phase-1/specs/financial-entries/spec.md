## ADDED Requirements

### Requirement: Asset and liability entries are append-only balance snapshots

The system SHALL record each asset or liability balance update as a new, immutable, timestamped snapshot entry rather than overwriting a previous value, so that balance history over time is preserved.

#### Scenario: Recording a new balance

- **WHEN** a user records an updated balance for an asset or liability category
- **THEN** the system creates a new snapshot entry with the current date, without modifying or removing any previously recorded snapshot for that category

#### Scenario: Balance history is retained

- **WHEN** a user has recorded multiple snapshots for the same category over time
- **THEN** the system retains all of them and can display the category's balance as of any previously recorded date

### Requirement: Income and expense entries are transactions

The system SHALL record each income or expense entry as a transaction with an amount, currency, date, category, and optional note, and SHALL NOT require a running ledger of every real-world transaction — a user may record a single aggregated entry for a period or multiple itemized entries, at their discretion.

#### Scenario: Single aggregated entry

- **WHEN** a user records one transaction representing a whole period's spending in a category (e.g. a monthly total)
- **THEN** the system accepts and stores it as a single valid entry, with no requirement to itemize further

#### Scenario: Multiple itemized entries

- **WHEN** a user records several individual transactions within the same category and period
- **THEN** the system stores each as a separate entry and includes all of them in that category's aggregate totals

### Requirement: Entries support multi-currency amounts

The system SHALL allow each entry (snapshot or transaction) to be recorded in a currency chosen by the user, independent of the entry's category or other entries.

#### Scenario: Entry in a non-base currency

- **WHEN** a user records an entry and selects a currency other than the base/reporting currency
- **THEN** the system stores the entry's original amount and selected currency without forcing conversion at entry time

### Requirement: Manually entered exchange rate locked at entry time

The system SHALL require a user to manually provide an exchange rate (to the base/reporting currency) when recording an entry in a non-base currency, and SHALL store that rate with the entry permanently, without recalculating it later against a different or updated rate.

#### Scenario: Recording an entry with a manual rate

- **WHEN** a user records an entry in a non-base currency
- **THEN** the system requires an exchange rate to be entered and stores it as part of that entry

#### Scenario: Later rate changes do not alter past entries

- **WHEN** a user records a new entry with a different exchange rate for the same currency
- **THEN** previously recorded entries retain the exchange rate that was in effect when they were created, unaffected by the new rate

### Requirement: Base currency is explicitly confirmed when saving the first entry

The system SHALL, when a user attempts to save their first entry (of any type), require the user to explicitly confirm a base/reporting currency before that entry is saved, presenting the choice as permanent and not to be revisited.

#### Scenario: Confirmation prompt on first entry

- **WHEN** a user attempts to save their first entry and no base currency has been finalized yet
- **THEN** the system presents a base currency confirmation step, suggesting a default derived from the user's Google account locale if determinable, otherwise the browser locale if determinable, otherwise IDR, and states that the choice is permanent

#### Scenario: Entry is not saved without confirmation

- **WHEN** a user is presented with the base currency confirmation step and does not confirm a choice
- **THEN** the system does not save the entry

#### Scenario: User overrides the suggested default

- **WHEN** a user is presented with the base currency confirmation step and selects a currency other than the suggested default
- **THEN** the system finalizes the user's selected currency, not the suggested one, as the base/reporting currency

#### Scenario: Base currency is fixed after confirmation

- **WHEN** a base currency has been confirmed and finalized
- **THEN** the system does not offer any way to change it, and displays it as a read-only value in Settings

### Requirement: Entries attach to a category

The system SHALL require every entry to be attached to exactly one category belonging to the matching entity type (asset and liability entries to asset/liability categories; income and expense entries to income/expense categories).

#### Scenario: Entry requires a category

- **WHEN** a user attempts to record an entry without selecting a category
- **THEN** the system does not accept the entry until a category is selected

#### Scenario: Entity type mismatch is rejected

- **WHEN** a user attempts to attach an income entry to an expense (or asset, or liability) category
- **THEN** the system rejects the attachment

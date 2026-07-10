## ADDED Requirements

### Requirement: Category tree per entity type

The system SHALL maintain a self-referencing category tree for each of the four entity types (asset, liability, income, expense), where every category belongs to exactly one entity type and may have zero or more child categories.

#### Scenario: Category created under an entity type

- **WHEN** a user creates a new category and selects an entity type (asset, liability, income, or expense)
- **THEN** the system creates the category within that entity type's tree, independent of the other three trees

### Requirement: Arbitrary category depth

The system SHALL allow a category to be nested under a parent category to any depth, with no maximum depth enforced by the system.

#### Scenario: Deeply nested category

- **WHEN** a user creates a category as a child of an existing category that already has several ancestor levels
- **THEN** the system creates the new category at that depth without rejecting it for being too deep

#### Scenario: Entries attach at any depth, not only leaves

- **WHEN** a user attaches an entry to a category that itself has child categories
- **THEN** the system allows the entry to be attached directly to that non-leaf category

### Requirement: Fully custom, user-defined categories

The system SHALL allow users to create, rename, and delete their own categories within each entity type's tree, without restricting them to a fixed or predefined taxonomy.

#### Scenario: User creates a custom category

- **WHEN** a user creates a category with a name not present in the recommended starter set
- **THEN** the system creates it as a first-class category, usable identically to any recommended category

### Requirement: Recommended starter categories

The system SHALL seed each entity type's category tree with a recommended set of common categories (2-3 levels deep) the first time a user's account is initialized, and SHALL treat these seeded categories as ordinary user-owned categories thereafter.

#### Scenario: Starter categories present on first use

- **WHEN** a new user signs in to Fin for the first time
- **THEN** the system creates a recommended starter category tree for each entity type before the user has created any categories of their own

#### Scenario: Starter categories are fully editable

- **WHEN** a user renames, reparents, or deletes a seeded starter category
- **THEN** the system applies the change exactly as it would for any user-created category, with no special protection

### Requirement: Rollup aggregation includes descendants

The system SHALL compute a category's aggregate reporting value as the sum of its own directly attached entries plus the aggregate values of all its descendant categories, recursively.

#### Scenario: Parent total includes child totals

- **WHEN** a category has entries attached both directly to it and to one or more descendant categories
- **THEN** any reporting view showing that category's total includes the value of its own entries plus all descendants' entries

### Requirement: Category deletion reassigns dependents to the parent

The system SHALL, when a category is deleted, reassign that category's direct entries and any child categories to the deleted category's parent category.

#### Scenario: Deleting a category with entries

- **WHEN** a user deletes a category that has entries attached directly to it
- **THEN** the system reassigns those entries to the deleted category's parent category

#### Scenario: Deleting a category with children

- **WHEN** a user deletes a category that has one or more child categories
- **THEN** the system reassigns those child categories to be direct children of the deleted category's parent category

### Requirement: Deletion without a valid parent falls back to Uncategorized

The system SHALL maintain a system-managed "Uncategorized" category for each entity type, and SHALL reassign entries and child categories to it when the category being deleted has no parent category.

#### Scenario: Deleting a root-level category

- **WHEN** a user deletes a category that has no parent category (a root-level category) and that category has entries or children
- **THEN** the system reassigns those entries and children to the entity type's "Uncategorized" category

#### Scenario: Uncategorized category cannot be deleted

- **WHEN** a user attempts to delete the system-managed "Uncategorized" category for an entity type
- **THEN** the system prevents the deletion

### Requirement: Uncategorized is not a manageable or selectable category

The system SHALL exclude the "Uncategorized" system category from the category management UI and SHALL NOT offer it as a selectable option when creating or editing an entry, since it exists solely as an automatic fallback destination rather than a category users browse, edit, or choose. Entries that end up in it remain fully visible and included in reporting.

#### Scenario: Uncategorized hidden from category management

- **WHEN** a user views the category management UI for an entity type
- **THEN** the system does not list the "Uncategorized" category alongside the user's own categories

#### Scenario: Uncategorized not offered when recording an entry

- **WHEN** a user selects a category while creating or editing an entry
- **THEN** the system does not offer "Uncategorized" as one of the selectable categories

#### Scenario: Uncategorized entries remain visible in reporting

- **WHEN** the "Uncategorized" category holds one or more entries as a result of automatic reassignment
- **THEN** those entries and their value remain included in aggregate reports, and the user can view and recategorize them from a reporting view

### Requirement: Category reparenting updates historical rollups

The system SHALL allow a user to change a category's parent (reparenting), and SHALL apply that change retroactively so that all reporting views, including those covering past dates, reflect the category's current position in the tree rather than its position at the time each entry was created.

#### Scenario: Reparenting changes past reports

- **WHEN** a user moves a category to a new parent, and that category has entries dated in the past
- **THEN** reporting views for those past dates reflect the category's new parent, not its previous parent

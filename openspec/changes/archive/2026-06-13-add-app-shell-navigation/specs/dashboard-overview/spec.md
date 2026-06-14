## ADDED Requirements

### Requirement: Dashboard landing screen

The system SHALL provide a `/dashboard` page that serves as the signed-in landing screen. It SHALL render inside the app shell and present a welcome banner, a stats grid, and a Recent Decks section.

#### Scenario: Viewing the dashboard

- **WHEN** a signed-in user opens `/dashboard`
- **THEN** the page shows a welcome banner, a stats grid, and a Recent Decks section within the app shell

### Requirement: Stats metrics marked as placeholders when unbacked

The dashboard stats grid SHALL display metrics matching the design (e.g. Current Streak, Studied Today). Metrics that are not yet tracked by the system SHALL render as placeholder values and SHALL be marked in code as un-backed (e.g. a `TODO` comment) so they are not mistaken for real data.

#### Scenario: Unbacked metric shown as placeholder

- **WHEN** the dashboard renders a metric that the system does not yet track (Current Streak, Studied Today)
- **THEN** a placeholder value is shown and the code marks it as not backed by real data

### Requirement: Recent Decks uses real deck data

The Recent Decks section SHALL be populated from the user's actual decks via the existing list-decks use case, scoped to the current user. Each entry SHALL link to its deck.

#### Scenario: User with decks

- **WHEN** a signed-in user with one or more decks opens the dashboard
- **THEN** the Recent Decks section lists their real decks, each linking to the corresponding deck

#### Scenario: User with no decks

- **WHEN** a signed-in user with no decks opens the dashboard
- **THEN** the Recent Decks section shows an empty state instead of fabricated decks

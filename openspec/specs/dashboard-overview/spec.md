# dashboard-overview Specification

## Purpose

Define the signed-in `/dashboard` landing screen: its welcome banner, stats grid (with unbacked metrics marked as placeholders), and a Recent Decks section populated from the user's real decks — including the per-deck study stats (total, due, progress) carried by each deck summary and rendered on every deck card.

## Requirements

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

### Requirement: Deck summaries carry real study stats

The list-decks use case SHALL return each deck as a summary enriched with its real card stats derived from spaced-repetition state, not placeholder values: a total card count, a due count, and a progress percentage. The due count SHALL include non-suspended cards that are due for review (`dueDate <= today`) or not yet scheduled (`dueDate` is null, i.e. new), mirroring the study-queue definition. The progress percentage SHALL be the share of cards scheduled ahead, computed as `round((total - due) / total * 100)`, and SHALL be `0` when the deck has no cards. These stats SHALL be computed in a single aggregate query scoped to the current user.

#### Scenario: Deck with new and scheduled cards

- **WHEN** list-decks returns a deck that has cards, some due or new and some scheduled into the future
- **THEN** the summary reports the total card count, a due count covering the due and new cards, and a progress percentage equal to `round((total - due) / total * 100)`

#### Scenario: Deck with no cards

- **WHEN** list-decks returns a deck that has no cards
- **THEN** the summary reports a total of `0`, a due count of `0`, and a progress of `0`

### Requirement: Deck cards display study stats

Each deck card SHALL render its deck summary's real stats wherever decks are listed (the dashboard Recent Decks section and the Library). A card SHALL show a progress bar reflecting the progress percentage, a due indicator, the progress percentage, and a review affordance. When the deck has no due cards it SHALL present an "up to date" state (e.g. an "Up to date" label and a "Done" affordance); otherwise it SHALL present the due-card count (e.g. "N cards due") and a "Review" affordance.

#### Scenario: Deck with due cards

- **WHEN** a deck card renders for a deck whose due count is greater than zero
- **THEN** the card shows the number of cards due, the progress percentage and bar, and a "Review" affordance

#### Scenario: Deck fully scheduled ahead

- **WHEN** a deck card renders for a deck whose due count is zero
- **THEN** the card shows an "up to date" state with a full progress bar and a "Done" affordance

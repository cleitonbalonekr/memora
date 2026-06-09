## MODIFIED Requirements

### Requirement: User can save selected drafts to the deck

The system SHALL provide a `saveSelectedDrafts` use case that persists the chosen, validated drafts as cards into the target deck, scoped to the current user, reusing the existing card repository. All selected drafts SHALL be persisted in a single atomic bulk operation: either every selected draft becomes a card or none does. After saving, the deck view SHALL reflect the new cards.

#### Scenario: Save selected drafts

- **WHEN** the user confirms saving the selected drafts into a deck they own
- **THEN** the system creates one card per selected draft in that deck in a single bulk operation and returns a success result

#### Scenario: Saved cards respect the length cap

- **WHEN** selected drafts are saved
- **THEN** every persisted card satisfies the shared card length cap

#### Scenario: Save into another user's deck rejected

- **WHEN** a save request targets a deck the user does not own
- **THEN** the system returns a not-found result and persists nothing

#### Scenario: Persistence failure leaves no partial save

- **WHEN** persisting the selected drafts fails partway through
- **THEN** no card from the batch remains in the deck (all-or-nothing)

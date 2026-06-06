## ADDED Requirements

### Requirement: User can request drafts from inside a deck

The system SHALL let an authenticated user start AI-assisted card creation from within a deck they own by entering a topic or pasting notes.

#### Scenario: Open the AI draft flow

- **WHEN** a user viewing a deck they own opens the AI card-creation entry point
- **THEN** the system presents an input for a topic or pasted notes and a control to generate drafts

#### Scenario: Loading state during generation

- **WHEN** the user submits the topic/notes and generation is in progress
- **THEN** the UI shows a pending state and disables resubmission until a result returns

### Requirement: User can review and edit drafts before saving

The system SHALL display the returned drafts and SHALL let the user edit the front and back text of any draft and select which drafts to keep. Edited drafts SHALL be subject to the same card validation rules as manually created cards.

#### Scenario: Edit a draft

- **WHEN** the user edits the front or back text of a draft
- **THEN** the change is reflected in the draft and validated against the card rules before it can be saved

#### Scenario: Select a subset to keep

- **WHEN** the user deselects some drafts and keeps others
- **THEN** only the selected drafts are eligible to be saved

#### Scenario: Edited draft violates a rule

- **WHEN** a user edits a draft so a side is empty or exceeds the hard length cap
- **THEN** the UI surfaces the validation error and prevents saving that draft

### Requirement: User can save selected drafts to the deck

The system SHALL provide a `saveSelectedDrafts` use case that persists the chosen, validated drafts as cards into the target deck, scoped to the current user, reusing the existing card repository. After saving, the deck view SHALL reflect the new cards.

#### Scenario: Save selected drafts

- **WHEN** the user confirms saving the selected drafts into a deck they own
- **THEN** the system creates one card per selected draft in that deck and returns a success result

#### Scenario: Saved cards respect the length cap

- **WHEN** selected drafts are saved
- **THEN** every persisted card satisfies the shared card length cap

#### Scenario: Save into another user's deck rejected

- **WHEN** a save request targets a deck the user does not own
- **THEN** the system returns a not-found result and persists nothing

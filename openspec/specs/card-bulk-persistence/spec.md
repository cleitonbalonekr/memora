# card-bulk-persistence Specification

## Purpose

Define how the `CardRepository` port exposes a bulk-create operation that persists multiple cards in a single atomic database operation, with ownership verified once, so callers such as `saveSelectedDrafts` can create many cards safely and efficiently.

## Requirements

### Requirement: Card repository creates many cards in one atomic operation

The `CardRepository` port SHALL provide a `createMany(inputs, userId)` method that persists a list of cards in a single atomic database operation. The operation SHALL verify deck ownership for the target deck once (not once per card) using the server-resolved `userId`, and SHALL persist either all cards or none. It SHALL return the created cards. When `inputs` is empty, it SHALL persist nothing and return an empty list.

#### Scenario: All cards persisted in a single atomic operation

- **WHEN** `createMany` is called with multiple card inputs for a deck the user owns
- **THEN** every card is persisted in one database write and the created cards are returned

#### Scenario: Ownership checked once for the target deck

- **WHEN** `createMany` is called with several inputs for the same owned deck
- **THEN** deck ownership is verified a single time before the insert
- **AND** the number of database round trips does not grow linearly with the number of cards

#### Scenario: Non-owned deck rejected and nothing persisted

- **WHEN** `createMany` targets a deck the user does not own
- **THEN** the operation throws an ownership error
- **AND** no card from the batch is persisted

#### Scenario: Empty input persists nothing

- **WHEN** `createMany` is called with an empty list of inputs
- **THEN** no database write occurs and an empty list is returned

#### Scenario: Partial failure persists nothing

- **WHEN** the insert of the batch fails after ownership has been verified
- **THEN** no card from the batch remains persisted (all-or-nothing)

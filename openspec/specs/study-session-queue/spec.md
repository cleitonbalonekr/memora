# study-session-queue Specification

## Purpose

Define how `StartStudySession` builds a deck's study queue from cards due for review today plus a capped number of new cards, excluding suspended cards, using only the server-resolved user identity for ownership.

## Requirements

### Requirement: A study session is built from due reviews plus capped new cards

`StartStudySession` SHALL build a deck's study queue from the cards due for review today plus a limited number of new cards, using only the server-resolved user identity for ownership. The queue SHALL exclude suspended cards. The repository SHALL enforce per-user ownership of the deck.

#### Scenario: Due review cards are included

- **WHEN** a user starts a study session for a deck they own
- **THEN** every non-suspended card whose `dueDate` is on or before today is included in the queue
- **AND** cards whose `dueDate` is after today are not included

#### Scenario: New cards are included up to the daily limit

- **WHEN** a deck has more new cards (never reviewed) than the daily new-card limit
- **THEN** at most the daily limit of new cards is added to the queue
- **AND** new cards already introduced earlier today count against that limit

#### Scenario: The daily new-card limit defaults to 20 per deck

- **WHEN** no new cards have been introduced for a deck today
- **THEN** up to 20 new cards are added to the session queue

#### Scenario: Suspended cards are excluded

- **WHEN** a deck contains cards that have been suspended as leeches
- **THEN** those cards do not appear in the study queue, whether or not they would otherwise be due

#### Scenario: Ownership is enforced

- **WHEN** a user attempts to start a study session for a deck they do not own
- **THEN** the session is not built and no cards are returned

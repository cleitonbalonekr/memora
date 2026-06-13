# card-review-recording Specification

## Purpose

Define how a single card grade is recorded during a study session: the `ReviewCard` use case persists each grade immediately (per press, not batched) by advancing the card's spaced-repetition state through the scheduler under server-resolved ownership, and how the `again` grade requeues a card within the current session.

## Requirements

### Requirement: Each grade is persisted immediately

The system SHALL provide a `ReviewCard` use case that records a single grade for a card during a study session. It SHALL resolve the acting user server-side, load the card's current spaced-repetition state scoped to that user, advance the state through the scheduler, and persist the result before returning. Persistence SHALL happen per grade press (not batched at session end) so an interrupted session does not lose recorded progress.

#### Scenario: A grade advances and persists the card's state

- **WHEN** the user grades a card `hard`, `good`, or `easy` during a session
- **THEN** the card's spaced-repetition state is recomputed by the scheduler and persisted
- **AND** the card's next `dueDate` reflects the new interval

#### Scenario: Again persists the lapse penalty

- **WHEN** the user grades a due review card `again`
- **THEN** the lapse penalty (interval reset, lapse increment, ease reduction, `dueDate = today`) is persisted immediately
- **AND** the card is not scheduled into the future

#### Scenario: A new card's first review is recorded

- **WHEN** the user grades a card that was new (never reviewed)
- **THEN** the card's `firstReviewedAt` is set to today
- **AND** the card counts against today's new-card limit for its deck

#### Scenario: Ownership is enforced on review

- **WHEN** a user attempts to grade a card they do not own
- **THEN** the grade is rejected and no state is persisted

### Requirement: Again requeues the card within the current session

The study session SHALL treat `again` as the only grade that keeps the card in the current session. A card graded `again` SHALL be moved to the end of the current session queue and shown again before the session completes. A card graded `hard`, `good`, or `easy` SHALL be removed from the current session.

#### Scenario: Again re-shows the card this session

- **WHEN** the user grades the current card `again`
- **THEN** the card is moved to the end of the session queue and shown again later in the same session

#### Scenario: A passing grade removes the card from the session

- **WHEN** the user grades the current card `hard`, `good`, or `easy`
- **THEN** the card is removed from the current session queue and is not shown again this session

#### Scenario: The session completes when the queue is empty

- **WHEN** every card in the session has received a passing grade
- **THEN** the session is complete

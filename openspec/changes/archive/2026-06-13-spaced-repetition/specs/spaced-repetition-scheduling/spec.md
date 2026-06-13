## ADDED Requirements

### Requirement: Scheduler computes the next review state from a grade

The study domain SHALL provide a pure `schedule(state, grade, today)` function that, given a card's current spaced-repetition state (`intervalDays`, `ease`, `reps`, `lapses`, `dueDate`, `firstReviewedAt`, `suspendedAt`), a grade (`again | hard | good | easy`), and today's date, returns the next state. The function SHALL perform no I/O and SHALL read no clock other than the supplied `today`, so it is deterministic and unit-testable in isolation.

Ease SHALL be stored as an integer permille (2500 = 2.50) and clamped to a minimum of 1300. Intervals SHALL be capped at a maximum of 365 days. Interval rounding SHALL use round-half-up.

#### Scenario: A new card graduates with good or hard

- **WHEN** `schedule` is called on a new card (`intervalDays = 0`, `dueDate = null`) with grade `good` or `hard`
- **THEN** the card graduates with `intervalDays = 1` and `dueDate = today + 1 day`
- **AND** `firstReviewedAt` is set to `today` if it was not already set

#### Scenario: A new card graduates with easy

- **WHEN** `schedule` is called on a new card with grade `easy`
- **THEN** the card graduates with `intervalDays = 4` and `dueDate = today + 4 days`

#### Scenario: Good multiplies the interval by ease

- **WHEN** `schedule` is called on a review card with grade `good`
- **THEN** the next interval is `max(intervalDays + 1, round(intervalDays * ease))`
- **AND** ease is unchanged
- **AND** `dueDate = today + nextInterval days`

#### Scenario: Hard grows the interval slowly and lowers ease

- **WHEN** `schedule` is called on a review card with grade `hard`
- **THEN** the next interval is `max(intervalDays + 1, round(intervalDays * 1.2))`
- **AND** ease is reduced by 0.15 (not below the 1.30 minimum)

#### Scenario: Easy applies the easy bonus and raises ease

- **WHEN** `schedule` is called on a review card with grade `easy`
- **THEN** the next interval is `max(intervalDays + 1, round(intervalDays * ease * 1.3))`
- **AND** ease is increased by 0.15

#### Scenario: The interval always grows by at least one day

- **WHEN** a scheduling grade would otherwise produce an interval less than or equal to the current interval (for example `hard` on a 1-day card)
- **THEN** the next interval is at least `intervalDays + 1`

#### Scenario: Ease never drops below the minimum

- **WHEN** repeated `again` or `hard` grades would push ease below 1300 permille
- **THEN** ease is clamped at 1300

#### Scenario: Intervals are capped at the maximum

- **WHEN** a scheduling grade would produce an interval greater than 365 days
- **THEN** the next interval is 365 days

### Requirement: Again lapses a review card

When grade `again` is applied to a review card, the scheduler SHALL reset the interval to the post-lapse minimum, increment the lapse counter, reset the success streak, and lower ease, without scheduling the card far into the future.

#### Scenario: A forgotten review card resets

- **WHEN** `schedule` is called on a review card with grade `again`
- **THEN** `intervalDays` is reset to 1
- **AND** `lapses` is incremented by 1
- **AND** `reps` is reset to 0
- **AND** ease is reduced by 0.20 (not below the minimum)
- **AND** `dueDate` is set to `today`

#### Scenario: Again on a new card does not penalize ease

- **WHEN** `schedule` is called on a new card (never graduated) with grade `again`
- **THEN** the card remains new (`intervalDays = 0`, `dueDate` unchanged)
- **AND** ease is unchanged

### Requirement: Chronic failures are suspended as leeches

A card whose lapse count reaches the leech threshold SHALL be suspended so it is excluded from future study queues.

#### Scenario: Reaching the leech threshold suspends the card

- **WHEN** an `again` grade brings a card's `lapses` to 8 or more
- **THEN** `suspendedAt` is set to `today`

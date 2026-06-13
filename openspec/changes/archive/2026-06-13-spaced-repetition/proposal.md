## Why

Cards are created and stored, but there is no way to *review* them on a schedule. `StartStudySession` loads every card in a deck (creation order) into an ephemeral in-memory session, and `StudyRunner` runs a round-robin re-queue (`got_it` drops a card, `review_again` pushes it to the tail) that is never persisted. When the tab closes, the session is gone. Nothing spaces reviews over time, so users re-study every card every session and get none of the retention benefit the product exists to deliver (the forgetting curve described in `docs/spaced-repetition.md`).

`architecture-and-rules.md` (ADR-002) already earmarks spaced repetition as a phase-2 feature with genuine domain logic worth modeling. This change implements it with an Anki-style modified SM-2 algorithm at day-level granularity.

## What Changes

- Add per-card spaced-repetition state to the `cards` table (`intervalDays`, `ease`, `reps`, `lapses`, `dueDate`, `firstReviewedAt`, `suspendedAt`) plus a migration.
- Add a **pure scheduler** in the study domain: given a card's current SRS state, a grade, and today's date, it returns the next state (interval, ease, lapses, due date, suspension). This is the unit-testable core (ADR-007).
- Widen study grading from `got_it | review_again` to **four grades**: `again | hard | good | easy` (UI labels: "Don't know", "Hard", "Medium", "Easy").
- Split the two clocks: **`again` requeues the card within today's session** (keeps today's round-robin) and applies a lapse penalty; **`hard | good | easy` schedule a future `dueDate`** and remove the card from today's session.
- **Persist each grade press immediately** (per-press) through a new `ReviewCard` use case, so progress survives a closed tab.
- `StartStudySession` builds the daily queue from **due reviews** (`dueDate <= today`, not suspended) plus **up to 20 new cards per day per deck**.
- Auto-suspend **leeches** (cards with `lapses >= 8`) so chronic failures leave the rotation; cap intervals at **365 days**.
- Replace the two study buttons in `study-runner.tsx` with the four grading buttons.

## Capabilities

### New Capabilities
- `spaced-repetition-scheduling`: A pure domain scheduler computes a card's next review state (interval, ease, lapses, due date, suspension) from its current state and a four-level grade, following an Anki-style modified SM-2 at day granularity.
- `study-session-queue`: A study session for a deck is built from the cards due today plus a capped number of new cards per day, excluding suspended cards.
- `card-review-recording`: Each grade the user gives during a study session is persisted immediately to the card's spaced-repetition state, and `again` requeues the card within the current session.

## Impact

- `src/adapters/db/schema.ts`: new SRS columns on `cards`; new Drizzle migration under `src/adapters/db/migrations/`.
- `src/ports/card-repository.ts`: extend `Card`/repository with SRS fields, `listDueForStudy(deckId, userId, today, newLimit)`, and `saveReviewState(cardId, userId, state)`.
- `src/adapters/db/drizzle-card-repository.ts`: implement the new query and persistence methods (ownership-scoped).
- `src/features/study/domain/`: new `scheduler.ts` (pure SM-2 scheduler + parameters) and SRS types; `study-session.ts` widened to four grades.
- `src/features/study/use-cases/`: modify `StartStudySession` (due + capped-new queue); new `ReviewCard` use case (`AuthedUseCase`).
- `src/features/study/ui/study-runner.tsx`: four grading buttons; each press calls a server action that invokes `ReviewCard`.
- `src/app/(app)/decks/[deckId]/study/`: server action wiring for per-press persistence.
- `src/composition-root.ts`: `getReviewCard()` factory; `getStartStudySession()` unchanged in shape.
- `src/shared`: `StudyOutcome` replaced by a `ReviewGrade` union.
- Tests: unit tests for the scheduler (the bulk of new coverage), integration tests for `ReviewCard`, `StartStudySession` queue building, and the new repository methods.

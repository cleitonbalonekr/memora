## 1. Schema & migration

- [x] 1.1 Add SRS columns to the `cards` table in `src/adapters/db/schema.ts`: `intervalDays` (integer, default 0), `ease` (integer, default 2500), `reps` (integer, default 0), `lapses` (integer, default 0), `dueDate` (date, null), `firstReviewedAt` (date, null), `suspendedAt` (timestamptz, null).
- [x] 1.2 Generate the migration (`npm run db:generate`) and verify it adds nullable/defaulted columns with no backfill; apply locally (`npm run db:migrate`).
- [x] 1.3 Add an index on `(deck_id, due_date)` to support the due-card query.

## 2. Domain scheduler (the core)

- [x] 2.1 Add `ReviewGrade = "again" | "hard" | "good" | "easy"` and `SrsState` (`{ intervalDays, ease, reps, lapses, dueDate, firstReviewedAt, suspendedAt }`) to the study domain types.
- [x] 2.2 Add SRS parameters as named constants in `src/features/study/domain/scheduler.ts` (starting ease 2500, min ease 1300, easy bonus 1.30, hard mult 1.20, ease deltas, graduating 1d, easy 4d, post-lapse 1d, leech threshold 8, max interval 365, new/day 20). No magic numbers.
- [x] 2.3 Implement `schedule(state, grade, today): SrsState` as a pure function following the grading table: new-card graduation (`good`/`hard` → 1d, `easy` → 4d), review-card interval `max(I+1, round(I*mult))`, ease deltas with clamp to min, `again` lapse (interval → 1, `lapses += 1`, `reps = 0`, `dueDate = today`), `reps += 1` on scheduling grades, interval cap at 365, and `suspendedAt = today` when `lapses >= 8`. Use round-half-up.
- [x] 2.4 Decide and document graduation: a new card's `firstReviewedAt` is set to `today` the first time it is graded (any grade), enabling the per-day new-card count.

## 3. Session domain (four grades)

- [x] 3.1 Replace `StudyOutcome` with `ReviewGrade` in `src/features/study/domain/study-session.ts`; `again` requeues the current card to the tail (old `review_again`), `hard|good|easy` remove it (old `got_it`).
- [x] 3.2 Update `recordResult` and any callers/types so the four-grade flow compiles; keep `reveal`, `currentCard`, `isComplete`, `progress` behavior unchanged.

## 4. Port

- [x] 4.1 Extend the `Card` type and `CardRepository` in `src/ports/card-repository.ts` to carry SRS fields.
- [x] 4.2 Add `listDueForStudy(deckId: string, userId: string, today: Date, newLimit: number): Promise<Card[]>` returning due reviews (`dueDate <= today`, not suspended, most-overdue first) plus up to the remaining new-card allowance (`dueDate IS NULL`, not suspended, by `createdAt`).
- [x] 4.3 Add `saveReviewState(cardId: string, userId: string, state: SrsState): Promise<void>` (ownership-scoped) to persist the scheduler output.

## 5. Adapter

- [x] 5.1 Implement `listDueForStudy` in `src/adapters/db/drizzle-card-repository.ts`: verify deck ownership once; compute `newToday = count(cards WHERE deck_id = ? AND first_reviewed_at = today)`; select due reviews + `max(0, newLimit - newToday)` new cards; map rows (including SRS fields) to `Card`.
- [x] 5.2 Implement `saveReviewState`: ownership-scoped `UPDATE` of the SRS columns; throw the standard "not found or unauthorized" error when no row matches.
- [x] 5.3 Update existing `create`/`createMany`/`findById`/`listByDeckId`/`update` mappers to include the new SRS fields.

## 6. Use cases

- [x] 6.1 Modify `StartStudySession` (`src/features/study/use-cases/start-study-session.ts`) to call `listDueForStudy(deckId, user.id, today, 20)` instead of `listByDeckId`, returning the queue.
- [x] 6.2 Add `ReviewCard extends AuthedUseCase<{ cardId: string; grade: ReviewGrade }, ...>` in `src/features/study/use-cases/`: load the card (ownership-scoped), run `schedule(state, grade, today)`, persist via `saveReviewState`; set `firstReviewedAt` on first grade of a new card. Return a typed result.
- [x] 6.3 Add `getReviewCard()` to `src/composition-root.ts` as a per-call factory (fresh instance, request-scoped auth gateway — never cached).

## 7. Web & UI

- [x] 7.1 Add a server action under `src/app/(app)/decks/[deckId]/study/` that validates `{ cardId, grade }` at the boundary and invokes `getReviewCard().execute(...)`.
- [x] 7.2 Replace the two buttons in `src/features/study/ui/study-runner.tsx` with four grading buttons ("Don't know" → `again`, "Hard" → `hard`, "Medium" → `good`, "Easy" → `easy`); each press calls the server action (per-press persistence) before advancing the in-memory session.
- [x] 7.3 Keep `again` requeuing in-session (round-robin) and `hard|good|easy` removing the card; preserve the existing session-complete screen.

## 8. Tests

- [x] 8.1 Unit tests for `schedule` (the bulk): graduation per grade; review-interval growth incl. the `max(I+1, ...)` floor; ease deltas and min-ease clamp; the worked-example sequence; lapse reset; leech suspension at 8 lapses; interval cap at 365; round-half-up boundaries.
- [x] 8.2 Integration test for `StartStudySession`: returns due reviews + new cards capped at the remaining daily allowance; excludes suspended and not-yet-due cards; respects `newToday`.
- [x] 8.3 Integration test for `ReviewCard`: each grade persists the expected SRS state; `again` persists the lapse penalty and `dueDate = today`; ownership is enforced (a foreign card is rejected, nothing persisted).
- [x] 8.4 Integration tests for `listDueForStudy` / `saveReviewState` at the repository level (ownership, due/new filtering, daily new-card count).
- [x] 8.5 Component test for `study-runner`: four buttons render; `again` re-shows the card, a passing grade advances; the action is called per press.

## 9. Verification

- [x] 9.1 Run `npm run lint` and `tsc --noEmit`; fix any violations (including the ADR-005 boundary rule — the scheduler imports nothing outside the domain).
- [x] 9.2 Run the full test suite and confirm green.
- [x] 9.3 Manually verify a full loop locally: new card → grade → correct next due date; lapse drops the interval; a card not due today does not appear; the 21st new card of the day is held back.

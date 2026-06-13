## Context

The study feature today is entirely ephemeral. `StartStudySession.handle` (`src/features/study/use-cases/start-study-session.ts`) loads `cards.listByDeckId(deckId, userId)` in creation order and maps them to `StudyCard`. `StudyRunner` (`src/features/study/ui/study-runner.tsx`) holds the session in React state via `createSession`/`recordResult` (`src/features/study/domain/study-session.ts`): `got_it` drops the card, `review_again` pushes it to the tail. No review outcome is persisted, and the `cards` table has no scheduling columns.

Spaced repetition is, by definition, cross-session: the value comes from *when a card next appears*, which must be persisted. This change adds a persisted per-card state and a pure scheduler that advances it, while reusing the existing in-session round-robin for the "drill until you get it today" loop.

We follow Anki's **modified SM-2**, adapted to two product constraints decided during exploration:
- **Day-level granularity** — no sub-day learning steps; Anki's "Learning"/"Relearning" states collapse into the existing within-session round-robin.
- **20 new cards per day per deck** — Anki's default, configurable per-user later (out of scope here).

## Goals / Non-Goals

**Goals:**
- A pure, deterministic scheduler: `schedule(state, grade, today) -> state`, unit-testable with no I/O.
- Four grades (`again | hard | good | easy`) with Anki-faithful interval/ease behavior.
- Persist every grade press immediately (per-press).
- Build each day's queue from due reviews + a capped number of new cards.
- Auto-suspend leeches; cap intervals at 365 days.

**Non-Goals:**
- Sub-day (minutes/hours) learning steps — granularity is day-level.
- Per-user / per-deck configuration of new-card limit, intervals, or ease (future).
- A review-history/log table — not needed for the algorithm (see Decisions).
- Stats, streaks, retention dashboards, heatmaps.
- Shared decks (the single-owner assumption below depends on this staying out of scope).

## Decisions

### Two persisted card states; learning folds into the session

Anki has New, Learning, Review, Relearning. At day granularity, Learning/Relearning can't have sub-day steps, so they collapse into the existing within-session round-robin. That leaves two persisted states:

```
   new card  ──▶  NEW (intervalDays=0, dueDate=null, due immediately)
                    │  press hard/good/easy = "graduate"
                    ▼
                  REVIEW (intervalDays>=1, dueDate set, ease drives growth)
                    │  lapses >= 8
                    ▼
                  SUSPENDED (suspendedAt set, excluded from the queue)

   "again" never schedules — it requeues inside today's session and applies a lapse penalty.
   "hard | good | easy" schedule a future dueDate and remove the card from today's session.
```

State is derived, not a stored enum: `suspendedAt IS NOT NULL` → suspended; else `dueDate IS NULL` → new; else review. This keeps columns lean and queries simple (index `dueDate`).

### The scheduler is a pure function in the domain

`src/features/study/domain/scheduler.ts` exposes `schedule(state: SrsState, grade: ReviewGrade, today: Date): SrsState`. It performs no I/O and reads no clock beyond the injected `today`. This is the ADR-007 unit-test target and the ADR-002 "genuine domain logic" for phase 2.

`SrsState` mirrors the persisted columns: `{ intervalDays, ease, reps, lapses, dueDate, firstReviewedAt, suspendedAt }`.

**The grading rules.** Let `I` = `intervalDays`, `E` = `ease`. `round` is round-half-up.

| Grade | New card | Review card (due) | Ease delta | In-session |
|---|---|---|---|---|
| `again` | stays in session, no schedule, no ease change | lapse: `I -> 1`, `lapses += 1`, `reps = 0` | `-0.20` (review only) | requeue to tail |
| `hard` | graduate, `I = 1` | `I = max(I + 1, round(I * 1.2))` | `-0.15` | leaves |
| `good` | graduate, `I = 1` | `I = max(I + 1, round(I * E))` | `0` | leaves |
| `easy` | graduate, `I = 4` | `I = max(I + 1, round(I * E * 1.3))` | `+0.15` | leaves |

After any scheduling grade: `E = clamp(E, 1.30, infinity)`; `I = min(I, 365)`; `dueDate = today + I days`; `reps += 1`; if `lapses >= 8` set `suspendedAt = today`.

The `max(I + 1, ...)` floor guarantees at least one day of growth (without it, `hard` on a 1-day card rounds back to 1 and never moves). Ease only changes for Review cards; a new card graduates at the starting ease.

**Parameters (Anki defaults, except max interval):**

| Parameter | Value |
|---|---|
| Starting ease | 2.50 |
| Minimum ease | 1.30 |
| Easy bonus | 1.30 |
| Hard multiplier | 1.20 |
| Ease delta (again / hard / good / easy) | `-0.20 / -0.15 / 0 / +0.15` |
| Graduating interval (good/hard on new) | 1 day |
| Easy interval (easy on new) | 4 days |
| Post-lapse interval | 1 day |
| Leech threshold | 8 lapses |
| Max interval | 365 days |
| New cards/day/deck | 20 |

**Worked example** — one card graded `good, good, hard, good, easy, again, good`:

```
Day  Button  Calc                                    -> I    ease  lapses  next due
0    Good    graduate                                  1     2.50  0       Day 1
1    Good    max(2, round(1*2.50)=3)                   3     2.50  0       Day 4
4    Hard    max(4, round(3*1.2)=4), ease-0.15         4     2.35  0       Day 8
8    Good    max(5, round(4*2.35)=9)                   9     2.35  0       Day 17
17   Easy    max(10, round(9*2.35*1.3)=27), ease+0.15  27    2.50  0       Day 44
44   Again   lapse: I->1, ease-0.20, requeue           1     2.30  1       (stays in session)
44   Good    max(2, round(1*2.30)=2)                   2     2.30  1       Day 46
```

### Ease stored as an integer permille

`ease` is stored as `integer` permille (`2500` = 2.50) to avoid floating-point drift across thousands of multiply/add cycles. The scheduler converts to a decimal for arithmetic and back when persisting. The minimum clamp is `1300`.

### Four grades replace the two-outcome type

`StudyOutcome = "got_it" | "review_again"` becomes `ReviewGrade = "again" | "hard" | "good" | "easy"`. `study-session.ts` widens: `again` is the only grade that requeues to the tail (the old `review_again`); `hard | good | easy` remove the card from the queue (the old `got_it`). UI labels map "Don't know" → `again`, "Hard" → `hard`, "Medium" → `good`, "Easy" → `easy`.

### Persist per-press via a `ReviewCard` use case

Each button press calls a server action that invokes `ReviewCard` (`AuthedUseCase<{ cardId, grade }, ...>`): it loads the card's SRS state (ownership-scoped), runs `schedule(...)`, and persists via `cardRepository.saveReviewState`. `again` persists the lapse penalty and sets `dueDate = today` (so an abandoned session re-surfaces the card), while the client keeps the card in the round-robin. This costs one round trip per press but means a closed tab never loses progress.

**Alternative considered — batch persistence at session end.** Rejected: simpler and chattier-free, but a closed tab or crash loses the whole session's reviews, which is the exact data this feature exists to keep.

### Queue building in `StartStudySession`

`StartStudySession` returns the day's queue from a single repository method `listDueForStudy(deckId, userId, today, newLimit)`:

1. **Due reviews** — `dueDate <= today AND suspendedAt IS NULL`, ordered most-overdue first.
2. **New cards** — `dueDate IS NULL AND suspendedAt IS NULL`, ordered by `createdAt`, limited to `newLimit` remaining for today.

The new-card limit for today is `max(0, 20 - newToday)` where `newToday = count(cards in deck with firstReviewedAt = today)`. The repository computes this so the use case stays thin.

### One extra column, not a history table

The only thing that requires knowing the past is the "20 new cards per *day*" cap across multiple sessions in a day — answered by a single `firstReviewedAt` date column (set when a new card is first graded), not a review-log table. A history/log table would enable stats later but the algorithm never reads it, so it is out of scope (YAGNI per ADR / coding standards).

### SRS state lives on the `cards` row

A card belongs to exactly one deck which belongs to exactly one user, so there is no `(user, card)` fan-out — SRS state is denormalized onto the `cards` row. **This assumption breaks if decks ever become shareable**, at which point SRS state must move to a `(user_id, card_id)` table. Called out so the future migration is a known, deliberate step rather than a surprise.

## Risks / Trade-offs

- **Float drift in ease** → store ease as integer permille; clamp to `[1300, ...]`; unit-test long grade sequences for stability.
- **Rounding ambiguity** (`round(2.5)`) → fix round-half-up as the documented rule and pin it with unit tests on boundary intervals.
- **`again` semantics straddle two clocks** → the spec is explicit: `again` persists the lapse + ease drop + `dueDate = today` and requeues in-session; only `hard | good | easy` schedule forward and remove the card. Integration tests assert both the persisted penalty and the in-session requeue.
- **Existing study tests/behavior** → the round-robin re-queue is preserved (now keyed on `again`); existing session-completion behavior is the regression guard.
- **Migration on a populated `cards` table** → all new columns are nullable or defaulted (`intervalDays default 0`, `ease default 2500`, `reps default 0`, `lapses default 0`, `dueDate null`), so existing cards become valid "new" cards with no backfill.

## Migration Plan

1. Add SRS columns to `cards` in `schema.ts`; generate and apply a Drizzle migration (`npm run db:generate`, `npm run db:migrate`). Existing cards default to the "new" state (interval 0, ease 2500, due now) with no backfill.
2. Ship the scheduler, port methods, adapter methods, `ReviewCard`, `StartStudySession` change, and UI together. The web layer reads four grades; the domain and persistence land in the same change so there is no intermediate broken state.
3. Rollback is reverting the commit and dropping the columns; no card content is affected (SRS columns are additive).

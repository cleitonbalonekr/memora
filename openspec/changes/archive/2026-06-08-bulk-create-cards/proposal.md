## Why

`SaveSelectedDrafts` persists AI drafts one card at a time inside a `for` loop, and each iteration of `DrizzleCardRepository.create` runs its own ownership `SELECT` plus an `INSERT` (2 round trips per card). Saving N drafts costs 2N database round trips, the writes are not atomic (a failure mid-loop leaves earlier cards persisted), and latency grows linearly with the number of selected drafts.

## What Changes

- Add a bulk-create operation to the `CardRepository` port (`createMany`) that persists many cards in a single atomic database operation, verifying deck ownership once rather than per card.
- Implement `createMany` in `DrizzleCardRepository` as one ownership check plus one multi-row `INSERT ... RETURNING`, wrapped in a transaction so the save is all-or-nothing.
- Update `SaveSelectedDrafts` to validate all drafts (unchanged) and then persist them through `createMany` in a single call instead of the per-draft loop.
- Keep the use case's observable result contract (`success` / `invalid_input` / `not_found`) and ownership semantics identical.

## Capabilities

### New Capabilities
- `card-bulk-persistence`: The card repository can create many cards in one atomic database operation, enforcing per-user deck ownership a single time and either persisting all cards or none.

### Modified Capabilities
- `ai-draft-review`: The `saveSelectedDrafts` requirement now persists all selected drafts in a single atomic bulk operation (all-or-nothing) rather than card-by-card.

## Impact

- `src/ports/card-repository.ts`: new `createMany` method on the `CardRepository` interface.
- `src/adapters/db/drizzle-card-repository.ts`: new `createMany` implementation using a single transaction.
- `src/features/ai/use-cases/save-selected-drafts.ts`: replace the per-draft loop with one `createMany` call.
- Tests: `save-selected-drafts.integration.test.ts` (behavior preserved) plus new repository-level coverage for `createMany` (atomicity, ownership, length-preserving).
- No schema migration, no API surface change, no change to the web layer or composition root wiring.

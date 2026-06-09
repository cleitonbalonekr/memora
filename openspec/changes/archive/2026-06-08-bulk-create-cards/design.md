## Context

`SaveSelectedDrafts.handle` validates every draft against the shared card rules, then loops over the normalized drafts calling `cardRepository.create(...)` once per draft. `DrizzleCardRepository.create` performs a deck-ownership `SELECT` followed by an `INSERT ... RETURNING` — so saving N drafts issues 2N database round trips.

Two problems follow from the loop:

1. **Performance**: latency scales linearly with the number of drafts, and the redundant ownership `SELECT` repeats for every card even though all drafts in one save share a single `deckId`.
2. **Atomicity**: the loop is not transactional. The current code comment assumes "a non-owned deck throws on the first create, so nothing is persisted," which holds for the ownership case — but any failure on the K-th insert (constraint, connection drop) leaves K-1 cards already persisted, a partial save.

The `CardRepository` port is the seam (ADR-003); the use case depends only on the interface, and the integration tests exercise the real Drizzle adapter against a test Postgres.

## Goals / Non-Goals

**Goals:**
- Persist all selected drafts in a single database operation with one ownership check.
- Make the save all-or-nothing (atomic).
- Preserve the use case's existing result contract and ownership semantics exactly.
- Keep the domain validation (length cap, single concept) in the use case, unchanged.

**Non-Goals:**
- No change to the `cards` table schema or migrations.
- No batching across multiple decks in one call (a save targets exactly one deck).
- No change to manual single-card creation (`create` stays for the card CRUD path).
- No web-layer or composition-root wiring changes.

## Decisions

### Add `createMany(inputs: CreateCardInput[], userId: string): Promise<Card[]>` to `CardRepository`

A dedicated bulk method keeps the port small and honest: callers that need atomic multi-insert get a contract for it, while `create` stays for the single-card path. The signature mirrors `create` (an array of the same `CreateCardInput`, the server-resolved `userId`) so it composes with existing ownership rules.

**Alternative considered — overload `create` to accept an array.** Rejected: it muddies a focused method and weakens its return type. A separate method follows interface segregation (ADR / SOLID) and reads clearly at the call site.

**Alternative considered — keep the loop but wrap it in a transaction.** Rejected: it fixes atomicity but not the 2N round trips, and the ownership `SELECT` still repeats per card.

### Implement with one ownership check + one multi-row insert inside a transaction

`DrizzleCardRepository.createMany` derives the distinct `deckId`(s) from the inputs (in practice one, since the use case passes a single deck), verifies ownership with a single `SELECT` constrained to `userId`, then issues one `db.insert(cards).values([...]).returning()`. The ownership check and the insert run inside `db.transaction(...)` so a failure at any point rolls back to nothing persisted. Empty input short-circuits to `[]` with no database call.

### `SaveSelectedDrafts` calls `createMany` once after validation

The validation loop stays (it must reject the whole batch before any write). The persistence loop is replaced by a single `this.cards.createMany(normalized.map(d => ({ deckId, ... })), user.id)`. `mapError`/`mapSaveError` already translate the ownership error into `not_found`, so the `not_found` path is preserved without change.

## Risks / Trade-offs

- **A non-owned deck must still surface as `not_found`** → `createMany` throws the same ownership error string the use case's `mapSaveError` already recognizes; an integration test asserts the `not_found` result and that nothing is persisted.
- **Multi-row insert column/order drift** → use Drizzle's `.values([...])` with explicit field objects (same shape as `create`) rather than positional SQL, and assert returned cards in tests.
- **Behavior regression in the existing save flow** → the existing `save-selected-drafts.integration.test.ts` cases (success, length-cap rejection, foreign-deck rejection) must keep passing unchanged; they are the regression guard.

## Migration Plan

No data migration. Ship adapter + port + use-case change together in one commit. Rollback is reverting the commit; no persisted-data or schema implications.

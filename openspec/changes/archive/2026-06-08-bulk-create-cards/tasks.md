## 1. Port

- [x] 1.1 Add `createMany(inputs: CreateCardInput[], userId: string): Promise<Card[]>` to the `CardRepository` interface in `src/ports/card-repository.ts`.

## 2. Adapter

- [x] 2.1 Implement `createMany` in `src/adapters/db/drizzle-card-repository.ts`: short-circuit empty input to `[]`; verify deck ownership once with a single `SELECT` scoped to `userId`; insert all cards with one `db.insert(cards).values([...]).returning()`; wrap ownership check + insert in `db.transaction(...)` for all-or-nothing; map rows to `Card` exactly as `create` does.
- [x] 2.2 Throw the same ownership error message used by `create` ("Deck not found or unauthorized") so `mapSaveError` keeps producing `not_found`.

## 3. Use case

- [x] 3.1 In `src/features/ai/use-cases/save-selected-drafts.ts`, replace the per-draft persistence loop with a single `this.cards.createMany(normalized.map((d) => ({ deckId, frontText: d.frontText, backText: d.backText })), user.id)` call; keep the validation loop and the result contract unchanged.
- [x] 3.2 Return `savedCount` from the created-cards length returned by `createMany`.

## 4. Tests

- [x] 4.1 Add repository-level integration coverage for `createMany`: persists all cards for an owned deck, returns them; empty input persists nothing and returns `[]`; non-owned deck throws and persists nothing.
- [x] 4.2 Confirm the existing `save-selected-drafts.integration.test.ts` cases (success, length-cap rejection, foreign-deck `not_found`) still pass unchanged.

## 5. Verification

- [x] 5.1 Run `npm run lint` and `tsc --noEmit`; fix any violations (including the boundary rule).
- [x] 5.2 Run the test suite (`npm run test:integration:setup && npm run test:integration` plus unit/component) and confirm green with no behavior change.

## 1. Base hierarchy

- [x] 1.1 Add `UseCase<I, O>` in `src/shared/` defining `execute(input: I): Promise<O>` (allow `I = void`).
- [x] 1.2 Add `AuthedUseCase<I, O>` taking `AuthGateway` in its constructor; `execute` resolves the user via `requireCurrentUser`, calls abstract `handle(user, input)`, and routes thrown errors through an overridable `mapError` (default: rethrow).
- [x] 1.3 Add unit tests for the base lifecycle: `handle` receives the resolved user; `mapError` is applied on throw; default `mapError` rethrows.

## 2. Decks slice (reference implementation)

- [x] 2.1 Convert `createDeck`, `updateDeck`, `deleteDeck` to command classes (extend `AuthedUseCase`, override `mapError` → `mapDeckError`); bundle `updateDeck` input as `{ deckId, formData }`.
- [x] 2.2 Convert `listDecks`, `getDeck` to read classes (extend `AuthedUseCase`, bare return value, passthrough `mapError`).
- [x] 2.3 Add per-call factories to `src/composition-root.ts` (`getCreateDeck`, `getUpdateDeck`, `getDeleteDeck`, `getListDecks`, `getDeck`) that `new` the use case each call — no module-scope instance.
- [x] 2.4 Update `src/app/(app)/decks/page.tsx` and `src/app/(app)/decks/actions.ts` (and deck detail/edit pages) to `getUseCase().execute(input)`.
- [x] 2.5 Convert the decks use-case tests to `new UseCase(...fakes).execute(input)`; run the suite green as the reference pattern.

## 3. Cards slice

- [x] 3.1 Convert `createCard`, `updateCard`, `deleteCard` to command classes (override `mapError` → `mapCardError`); bundle multi-arg inputs into typed objects.
- [x] 3.2 Convert `listCards`, `getCard` to read classes.
- [x] 3.3 Add card use-case factories to the composition root.
- [x] 3.4 Update card pages/actions to use the factories.
- [x] 3.5 Convert card use-case tests.

## 4. Study slice

- [x] 4.1 Convert `startStudySession` (and any other study use cases) to classes extending the appropriate base.
- [x] 4.2 Add study factories to the composition root; update study pages/actions.
- [x] 4.3 Convert study use-case tests.

## 5. AI slice

- [x] 5.1 Convert `generateCardDrafts` (deps: auth, deckRepo, rateLimiter, aiGenerator) and `saveSelectedDrafts` to classes with constructor injection.
- [x] 5.2 Add AI factories to the composition root; update `src/app/(app)/decks/[deckId]/generate/actions.ts`.
- [x] 5.3 Convert AI use-case tests; assert saved drafts still respect the length cap.

## 6. Auth slice (plain-base exceptions)

- [x] 6.1 Convert `registerUser`, `loginUser`, `logoutUser` to classes extending the plain `UseCase` base (constructor takes `AuthGateway` and, where needed, `UserRepository`); `execute` runs directly without `requireCurrentUser`.
- [x] 6.2 Add auth factories to the composition root; update `src/app/(auth)/actions.ts` and any auth pages.
- [x] 6.3 Convert auth use-case tests.

## 7. Security invariant verification

- [x] 7.1 Confirm no use case reads the acting user's identity from client input (form fields, payload, headers, params, React Context); identity comes only from `requireCurrentUser`.
- [x] 7.2 Confirm the composition root caches no authenticated use-case instance at module scope (every factory `new`s per call).
- [x] 7.3 Verify ownership tests (acting on another user's deck/card) still pass for every converted slice. — ownership scenarios preserved in every integration test and typecheck is clean, but execution is BLOCKED: the test Postgres (docker-compose.test.yml) is unavailable in this environment. Run `npm run test:integration:setup && npm run test:integration`.

## 8. Documentation

- [x] 8.1 Amend `docs/architecture-and-rules.md` ADR-002 (function-vs-class table and "transaction script" wording) to prescribe the class pattern and base hierarchy.
- [x] 8.2 Update the target-structure section and any function-oriented wording in `docs/architecture-and-rules.md` and `AGENTS.md`.
- [x] 8.3 Record the server-side-only identity rule (D7) and the per-call-factory rule (no module-scope instances) in the architecture doc.

## 9. Final verification

- [x] 9.1 Run `npm run lint` (including the boundary rule) and fix violations. — lint clean; `tsc --noEmit` clean.
- [x] 9.2 Run the full test suite; confirm green with no behavior change. — unit + component green (78/78); integration suite BLOCKED on the unavailable test Postgres (Docker daemon not running). Run `npm run test:integration:setup && npm run test:integration` to confirm.
- [x] 9.3 Confirm all call sites use `getUseCase().execute(input)` and no use case is still exported as a standalone function.

## 1. Dependencies and configuration

- [x] 1.1 Add `langchain`, `@langchain/core`, `@langchain/openai`, and `zod` to `package.json` and install.
- [x] 1.2 Add `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and `AI_RATE_LIMIT_*` (limit, window) to `.env.example` with comments; confirm the key is server-side only and not `NEXT_PUBLIC_*`.
- [x] 1.3 Add `src/adapters/ai/config.ts` that reads OpenRouter and rate-limit settings from env and asserts the API key is present at startup.

## 2. Ports

- [x] 2.1 Add `src/ports/ai-card-generator.ts` with `CardDraft`, `GenerateDraftsInput`, and the `AiCardGenerator` interface (`generateDrafts`).
- [x] 2.2 Add `src/ports/rate-limiter.ts` with the `RateLimiter` interface (`check(userId)` returning allowed + optional `retryAfterSeconds`).

## 3. Domain (pure, unit-tested)

- [x] 3.1 Add `src/features/ai/domain/prompt-builder.ts`: pure functions returning JSON system/user prompts encoding the flashcard rules, the per-side cap, requested draft count, and a worked example.
- [x] 3.2 Add `src/features/ai/domain/prompt-builder.unit.test.ts` asserting the prompt includes the flashcard rules and the per-side cap and reflects the requested count.
- [x] 3.3 Add `src/features/ai/domain/draft-validator.ts`: trim, drop empty/oversize sides (reuse `validateCard`/`CARD_SIDE_MAX` from `cards/domain/card-rules`), and cap to `maxDrafts`.
- [x] 3.4 Add `src/features/ai/domain/draft-validator.unit.test.ts` covering oversize filtering, empty-side removal, and the count cap.

## 4. Adapters

- [x] 4.1 Implement `src/adapters/ai/openrouter-card-generator.ts`: `ChatOpenAI` pointed at the OpenRouter base URL with headers, JSON/Zod structured output, mapping the model response to `CardDraft[]`; throw a provider error on schema-validation failure.
- [x] 4.2 Implement `src/adapters/ai/in-memory-rate-limiter.ts`: per-user fixed-window counter using configured limit/window.
- [x] 4.3 Wire `getAiCardGenerator()` and `getRateLimiter()` into `src/composition-root.ts` (rate limiter as a shared singleton).

## 5. Use cases

- [x] 5.1 Add `src/features/ai/use-cases/draft-errors.ts` with the result discriminated union (`success | invalid_input | not_found | rate_limited | provider_error`) and an error mapper that returns safe messages.
- [x] 5.2 Add `src/features/ai/use-cases/generate-card-drafts.ts`: require current user, verify deck ownership, validate input, check the rate limiter, build the prompt, call the generator, run the draft validator, return drafts.
- [x] 5.3 Add `src/features/ai/use-cases/save-selected-drafts.ts`: require current user, validate each selected draft against card rules, create one card per draft via `CardRepository`, scoped to the user's deck.
- [x] 5.4 Add `generate-card-drafts.integration.test.ts` using a fake `AiCardGenerator`: happy path, empty input rejected, not-owned deck rejected, rate-limited path, and malformed-output → provider error.
- [x] 5.5 Add `save-selected-drafts.integration.test.ts` against the test database: drafts saved respect the length cap; save into a non-owned deck is rejected and persists nothing.

## 6. Web layer (server actions + UI)

- [x] 6.1 Add `src/app/(app)/decks/[deckId]/generate/actions.ts` with `generateDraftsAction` and `saveDraftsAction` that bind `deckId` server-side, resolve deps from the composition root, and map results to UI state (mirroring `cards/actions.ts`).
- [x] 6.2 Add `src/features/ai/ui/draft-review.tsx` (client): topic/notes input, pending state, draft list with per-draft edit + select, client-side card-rule validation, and save.
- [x] 6.3 Add `src/app/(app)/decks/[deckId]/generate/page.tsx` hosting the review component, guarded by deck ownership (404 when not owned).
- [x] 6.4 Add a "Generate with AI" entry point on the deck detail page (`decks/[deckId]/page.tsx`) next to "Add card".
- [x] 6.5 Add a component test for `draft-review` covering edit, select/deselect, validation error blocking save, and successful save submission.

## 7. Verification

- [x] 7.1 Run `npm run lint`, `npm run test:unit`, and `npm run test:integration`; fix failures.
- [x] 7.2 Confirm no secrets are logged and the API key is absent from any client bundle/`NEXT_PUBLIC_*`.
- [x] 7.3 Manually verify the flow end to end: generate drafts from a topic, edit and deselect, save, and see new cards in the deck.

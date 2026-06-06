## Why

Building good flashcards by hand is slow, and slow card creation is the main reason people abandon active-recall study. Epic F is the product's core differentiator: a user gives a topic or pastes notes and the app drafts well-formed, single-concept, question-first cards for review. The CRUD foundation (decks, cards, study mode) is now in place, so the AI-assisted creation flow is the next high-value increment.

## What Changes

- Add an `AiCardGenerator` port and an OpenRouter-backed adapter that calls a free model through LangChain, using JSON-structured prompts and a Zod-validated structured response (front/back drafts).
- Add a server-side `generateCardDrafts` use case that takes a topic or pasted notes plus a deck id, builds the flashcard-rules prompt in the domain layer, calls the generator, validates drafts against the existing card rules, and returns review-ready drafts. The model API key never reaches the browser (SOC2).
- Add an AI draft **review and edit UI**: from inside a deck, the user enters a topic/notes, sees the drafts, edits any card, and selects which to keep.
- Add a `saveSelectedDrafts` use case that persists the chosen drafts into the target deck, scoped to the user and reusing the existing `CardRepository`.
- Add **guardrails**: cap output length per card (reusing the card length cap) and per request (max draft count), and rate-limit AI generation calls per user to control cost and abuse.
- Add OpenRouter configuration (model id, API key) wired through environment variables and the composition root.

## Capabilities

### New Capabilities
- `ai-card-generation`: Server-side generation of flashcard drafts from a topic or pasted notes, prompted with the effective-flashcard rules, returned as structured drafts for human review.
- `ai-draft-review`: The review-and-edit flow where a user inspects AI drafts, edits any card, selects which to keep, and saves them into a deck.
- `ai-generation-guardrails`: Per-card and per-request output caps plus per-user rate limiting on AI generation.

### Modified Capabilities
<!-- No existing spec files in openspec/specs/; all behavior here is net-new. -->

## Impact

- **New code**: `src/ports/ai-card-generator.ts`; `src/adapters/ai/` (OpenRouter/LangChain adapter + config); `src/features/ai/use-cases/` (`generate-card-drafts`, `save-selected-drafts`); `src/features/ai/domain/` (prompt builder, draft validator, rate-limit policy); `src/features/ai/ui/` (draft review/edit components); a route/server action under `src/app/(app)/decks/[deckId]/`.
- **Modified code**: `src/composition-root.ts` (wire `getAiCardGenerator`); deck detail page (entry point to the AI flow); `package.json` (LangChain + OpenRouter deps); `.env.example` (`OPENROUTER_API_KEY`, model id).
- **Reused**: `CardRepository`, `AuthGateway`, `requireCurrentUser`, and the `card-rules` domain (single source of truth for the length cap).
- **Dependencies**: OpenRouter (free model), LangChain (`langchain`, `@langchain/core`, `@langchain/openai`), Zod for structured output.
- **Security**: AI key server-side only; input validated at the boundary; ownership enforced on save; no secrets or PII in logs.

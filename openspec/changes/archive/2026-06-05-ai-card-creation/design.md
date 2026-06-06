## Context

The app is a feature-first, layered Next.js 16 App Router codebase (ADR-001/004/005). External boundaries sit behind ports: `DeckRepository`, `CardRepository`, `UserRepository`, `AuthGateway`, each wired in `src/composition-root.ts` and consumed by use cases. Auth uses Supabase; persistence uses Drizzle/Postgres. The card length cap and single-concept hints already live in `src/features/cards/domain/card-rules.ts` (`CARD_SIDE_MAX`, `CARD_SIDE_RECOMMENDED`).

ADR-003 already names `AiCardGenerator` as the planned port for AI drafting. This change implements that port plus the `generateCardDrafts` and `saveSelectedDrafts` use cases described in the architecture doc's target structure. The reference implementation at `modulo02-integracao-apis-llms/04-song-highlights-z` shows the intended LangChain + OpenRouter + JSON-prompt approach: a `ChatOpenAI` client pointed at OpenRouter's base URL, JSON-structured system/user prompts, and a Zod schema for structured output.

The PRD specifies the AI call runs server-side, the key never reaches the browser, output is capped, and calls are rate-limited per user.

## Goals / Non-Goals

**Goals:**
- Implement `AiCardGenerator` as a port with an OpenRouter-backed adapter using LangChain and JSON prompts, starting with a free model.
- `generateCardDrafts` use case: validate input, build the flashcard-rules prompt (domain), call the generator, validate drafts against the shared card rules, return review-ready drafts.
- `saveSelectedDrafts` use case: persist selected, validated drafts via the existing `CardRepository`, scoped to the user.
- A mobile-first review/edit UI reachable from the deck view.
- Guardrails: per-card length cap, per-request draft cap, per-user rate limit, safe failures.

**Non-Goals:**
- Multi-provider AI abstraction beyond the single `AiCardGenerator` port (YAGNI — ADR-003).
- Persisting drafts before the user saves them (drafts live in client state during review).
- Streaming generation, regeneration history, or background jobs.
- A durable/distributed rate limiter (MVP uses a single-instance in-memory limiter behind a small interface).
- Spaced repetition or any change to study mode.

## Decisions

### D1: `AiCardGenerator` port returns validated draft data, not raw model output

The port exposes one method:

```ts
interface CardDraft { frontText: string; backText: string; }
interface GenerateDraftsInput { topicOrNotes: string; maxDrafts: number; }
interface AiCardGenerator {
  generateDrafts(input: GenerateDraftsInput): Promise<CardDraft[]>;
}
```

The adapter is responsible for the model call and for shaping output into `CardDraft[]`; the use case then runs the drafts through the shared card-rules validator. This keeps the port small and provider-agnostic (Interface Segregation), and keeps flashcard-rule validation in the domain where the manual editor already enforces it (DRY — one length cap).

**Alternative considered:** have the port return raw text and parse in the use case. Rejected — parsing/structuring is a provider concern and belongs in the adapter.

### D2: LangChain `ChatOpenAI` against OpenRouter with structured (JSON) output

Mirror the reference project: instantiate `ChatOpenAI` with `configuration.baseURL = "https://openrouter.ai/api/v1"`, the API key from `process.env.OPENROUTER_API_KEY`, OpenRouter headers (`HTTP-Referer`, `X-Title`), and the model id from env. Obtain structured output via a Zod schema describing `{ drafts: { frontText, backText }[] }`.

Because free models vary in tool-calling support, the adapter requests **JSON output and validates with Zod** (`safeParse`). If the model supports `withStructuredOutput`, use it; otherwise fall back to instructing JSON in the prompt and parsing the response. A response that fails schema validation is treated as a provider error (the use case maps it to a safe failure) — never passed downstream unvalidated.

**Default model:** a free OpenRouter instruct model set via `OPENROUTER_MODEL` (e.g. a `:free` Llama/Mistral-class instruct model). The id is configurable so we can swap models without code changes.

**Alternative considered:** call OpenRouter's REST API directly without LangChain. Rejected — LangChain gives us a consistent message/structured-output abstraction matching the team's reference example, and keeps the adapter thin.

### D3: JSON-structured prompts in the domain layer

The prompt builder lives in `src/features/ai/domain/` as a pure function and returns JSON strings (system + user), following the reference pattern. The system prompt encodes the effective-flashcard rules (short, single-concept, question-first, under the per-side cap) and the requested output shape with a worked example. The user prompt carries the topic/notes and the requested draft count. Being pure, it is unit-testable with no I/O (Testing Trophy: unit layer).

### D4: A separate draft validator in the domain, reusing `card-rules`

`src/features/ai/domain/draft-validator.ts` filters/normalizes `CardDraft[]`: trims, drops drafts with an empty side, drops or rejects any side over `CARD_SIDE_MAX`, and caps the count to `maxDrafts`. It calls into `validateCard` from `cards/domain/card-rules` so the length cap is defined once. Pure and unit-testable.

### D5: Drafts are not persisted until save; the UI holds them

`generateCardDrafts` returns drafts to the client. The review/edit component (client) holds drafts in local state, lets the user edit and select, validates edits against the card rules, and on confirm posts the selected drafts to a `saveSelectedDrafts` server action. `saveSelectedDrafts` re-validates server-side and creates cards via `CardRepository.create` (one per draft), scoped to the user. This avoids a "drafts" table (YAGNI) and reuses the existing card write path and ownership checks.

### D6: Web layer — route segment + server actions, mirroring existing CRUD

Add `src/app/(app)/decks/[deckId]/generate/` with a page hosting the input + review client component, and server actions (`generateDraftsAction`, `saveDraftsAction`) that bind `deckId` server-side (never from client form data), resolve dependencies from the composition root, call the use cases, and map typed results to UI state — exactly as `cards/actions.ts` does today. The deck detail page gets a "Generate with AI" entry point next to "Add card". Use-case results follow the existing discriminated-union pattern (`success | invalid_input | not_found | rate_limited | provider_error`).

### D7: Rate limiting behind a small interface, in-memory for MVP

Define a `RateLimiter` port (`check(userId): { allowed: boolean; retryAfterSeconds?: number }`) with a fixed-window in-memory adapter (per-user counter, configurable limit/window). The use case calls it before invoking the generator; over-limit returns a `rate_limited` result and the provider is never called. The interface keeps a durable implementation (e.g. Postgres/Redis) a one-adapter swap later.

**Alternative considered:** skip rate limiting for MVP. Rejected — the PRD lists it as an explicit guardrail (F4) for cost/abuse control.

### D8: Configuration and secrets

`OPENROUTER_API_KEY` (server-only), `OPENROUTER_MODEL`, and optional `AI_RATE_LIMIT_*` load from env via a small config module in `src/adapters/ai/`. `.env.example` documents them. The key is server-side only and never logged; provider errors are logged without secrets or PII (ADR-006).

## Risks / Trade-offs

- **Free models produce weak or malformed drafts** → Strong JSON prompt with the flashcard rules and a worked example; Zod validation rejects malformed output; the human review-and-edit step is mandatory before save; draft validator filters oversize/empty cards.
- **Free model lacks reliable structured-output / tool-calling** → Adapter prompts for JSON and validates with Zod rather than relying solely on native function calling; treat parse failures as provider errors.
- **In-memory rate limiter doesn't span instances or restarts** → Acceptable for MVP single-instance deploy; isolated behind `RateLimiter` so a durable adapter swaps in without touching use cases. Documented as a known limitation.
- **OpenRouter latency/timeouts on free tier** → Set a request timeout and surface a safe "try again" message; UI shows a pending state and blocks resubmission.
- **Prompt or output could leak into logs** → Log only error categories/metadata server-side; never log the API key, full prompts with pasted notes, or model payloads (PII redaction per org policy).

## Migration Plan

1. Add dependencies (`langchain`, `@langchain/core`, `@langchain/openai`, `zod`) and `.env.example` entries.
2. Add the `AiCardGenerator` and `RateLimiter` ports.
3. Implement the OpenRouter adapter, config module, and in-memory rate limiter; wire `getAiCardGenerator` / `getRateLimiter` into the composition root.
4. Add domain (prompt builder, draft validator) with unit tests; add use cases with integration tests using a fake `AiCardGenerator`.
5. Add server actions, the route segment, the review/edit UI, and the deck-view entry point.
6. No DB migration required (reuses the cards table). Rollback = remove the route/actions and the composition-root bindings; no data changes to revert.

## Open Questions

- Which specific free OpenRouter model is the default at launch? (Configurable via `OPENROUTER_MODEL`; pick a current `:free` instruct model during implementation.)
Lets use `meta-llama/llama-3.2-3b-instruct:free` or arcee-ai/trinity-large-preview:free for now
- Default rate-limit values (requests per window, window length)? Proposed starting point: a small per-minute cap per user, tunable via env. Yes let start with a small per-minute cap per user
- Default `maxDrafts` per request? Proposed starting point: ~10, capped to keep output cost bounded. Yes let start with ~10

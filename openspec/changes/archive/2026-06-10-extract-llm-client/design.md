## Context

AI card generation is the only AI flow in the app. It depends on `AiCardGenerator` (`generateDrafts(topicOrNotes) → CardDraft[]`), implemented by `OpenRouterCardGenerator`. That adapter pins a single free model, prompts for JSON, then extracts output with a substring scan (`indexOf('{')` … `lastIndexOf('}')`) and `JSON.parse` before a Zod `safeParse`. On the free tier this fails often: models stall or 429, and weaker models wrap or malform JSON. With link-context extraction and unique-card improvement planned, the provider plumbing would be duplicated per flow.

We resolved (in exploration) that the real external system is the LLM provider, not "card generation". The seam should be capability-shaped — a generic structured-completion client — with prompt-building and business validation staying in the feature domain. This change extracts that seam and hardens it; it adds no user-facing behavior. The reference `OpenRouterService.generateStructured<T>(system, user, schema)` from the song-highlights project informs the shape. The architecture rules (ADR-003 port-per-external-dependency, ADR-005 dependency direction, ADR-006 typed results / no leaked provider errors, and the lean/YAGNI rule) are the binding constraints.

## Goals / Non-Goals

**Goals:**
- A reusable `LlmClient` port: `generateStructured<T>({ system, user, schema, temperature? }) → Result<T>`.
- One adapter, `OpenRouterLlmClient`, concentrating free-tier reliability: native structured output with a parse fallback, a model fallback chain + throughput routing, one schema-repair retry, per-call temperature, and safe error mapping.
- Re-base `GenerateCardDrafts` on the new port with no change to its external result contract.
- Remove `AiCardGenerator` and its adapter; keep the test seam by faking `LlmClient`.

**Non-Goals:**
- `ContentFetcher`/link-reading, the link-detection branch, `ImproveCards`/`AiCardImprover` — separate later changes.
- Any LangGraph runtime or agentic tool-calling. The port exposes no tool surface.
- Changing rate limiting, ownership, input validation, or the draft-review UI.
- Changing the card rules or the draft validator.

## Decisions

### D1: The port is capability-shaped (`LlmClient`), not feature-shaped

`LlmClient.generateStructured<T>(input)` models the provider capability. The use case builds its own prompt (domain) and schema (domain) and calls the client.

- **Why over keeping `AiCardGenerator` over a shared client (Option A):** a feature adapter that only forwards a prompt to a shared client is a hollow pass-through — a wrong-altitude port. Collapsing to one capability port leaves exactly one AI thing in `adapters/` and puts reuse where it belongs (the generic client + shared domain prompt-builders).
- **Trade-off:** use-case tests now fake a generic client returning `{ drafts: [...] }` rather than faking "returns these drafts". Accepted; the fake is still trivial and arguably more realistic.

### D2: Pass the Zod schema across the port boundary

`generateStructured<T>` takes a `z.ZodSchema<T>` and returns validated `T`.

- **Why:** the schema *is* the contract; Zod is already a core dependency and was already used at this boundary. A JSON-Schema-only port would be more portable but clunky and unjustified for this app.
- **Alternative considered:** return `unknown` and validate in the use case — rejected because every flow would re-implement validate/repair, which is the duplication we are removing.

### D3: Result is a discriminated union, errors are categories (ADR-006)

```
type LlmResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "malformed" | "provider_unavailable" | "timeout" }
```

The adapter maps provider exceptions/timeouts to these categories and never surfaces raw provider errors, prompts, or pasted user content. `GenerateCardDrafts` keeps mapping to its existing `GenerateDraftsResult` (`mapGenerateError`), so the web contract is unchanged.

### D4: Structured output = native first, parse-and-validate fallback

Try langchain v1 native structured output (`withStructuredOutput(schema)`); if the model/provider does not support it, fall back to the current prompt-coercion + `extractJson` path. Either way the candidate is validated against the schema before success. This keeps the deliberate free-model tolerance the current code documents while gaining reliability where native support exists.

### D5: Model fallback chain + throughput routing

Config gains `models: [primary, …fallbacks]` and provider routing (`provider.sort.by: 'throughput'`), passed via `modelKwargs` as in the reference. The single `DEFAULT_MODEL` becomes the head of the list; fallbacks are env-overridable. This is the largest reliability lever on the free tier.

### D6: One schema-repair retry

On validation failure, re-issue once with the validation error appended ("your previous output failed because …; return corrected JSON"). One retry only — bounded cost, meaningful recovery on weak models. A second failure returns `malformed`.

### D7: Per-call temperature

`temperature` is an optional per-call input (default retains today's generative value). Generative drafting stays warm; future extraction flows can run cooler without a new adapter.

### D8: Where each responsibility lives

- **Adapter (`OpenRouterLlmClient`):** provider call, model routing/fallback, structured-output strategy + parse fallback, repair retry, schema *shape* validation, error mapping, timeout.
- **Domain (`features/ai/domain`):** `buildGenerationPrompt` (unchanged), `validateDrafts` business rules (unchanged), and a new `draft-schema.ts` holding the response Zod shape (moved out of the deleted adapter).
- **Use case (`GenerateCardDrafts`):** input validation, ownership, rate limit, build prompt + schema, call `LlmClient`, run `validateDrafts`, map result.

Dependency direction holds: use case → port + domain; adapter → port + provider SDK; composition root wires `OpenRouterLlmClient` into `getGenerateCardDrafts` via `getLlmClient()`.

## Risks / Trade-offs

- **Native structured output unreliable across free models** → keep the parse-and-validate fallback as the default-safe path; never depend solely on native support.
- **Repair retry / fallback chain inflate latency and token cost** → repair is capped at one attempt; the existing per-call timeout still bounds each request; routing favors throughput.
- **Removing `AiCardGenerator` churns AI tests** → re-target integration tests to a fake `LlmClient` in the same change; prompt-builder and draft-validator unit tests are untouched, preserving coverage of the rules.
- **Zod coupling in the port** → accepted (D2); revisit only if a non-Zod provider boundary ever appears.
- **Behavior drift in generation** → the external `GenerateDraftsResult` contract and the draft rules are unchanged; the integration test asserting drafts-from-topic guards against regressions.

## Migration Plan

1. Add `src/ports/llm-client.ts` and `src/adapters/ai/openrouter-llm-client.ts`; extend `config.ts` with the fallback list + routing.
2. Add `features/ai/domain/draft-schema.ts` (moved response shape).
3. Re-base `GenerateCardDrafts` on `LlmClient`.
4. Update `composition-root.ts`: replace `getAiCardGenerator` with `getLlmClient`, rewire `getGenerateCardDrafts`.
5. Delete `src/ports/ai-card-generator.ts` and `src/adapters/ai/openrouter-card-generator.ts`.
6. Re-target AI integration tests to a fake `LlmClient`; add adapter coverage for fallback + repair paths.
7. Static checks (types, lint, boundary rule) green.

Rollback is a straight revert — the change is internal, additive then subtractive, with no data or schema migration and no public API change.

## Open Questions

- Default fallback model list: which 2–3 free models to chain behind the primary? (Config default; env-overridable, so not blocking.)
- Repair-retry temperature: reuse the call temperature or force a low value for the corrective attempt? (Lean low; decide during implementation.)

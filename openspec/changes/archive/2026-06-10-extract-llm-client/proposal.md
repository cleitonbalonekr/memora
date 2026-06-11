## Why

AI card generation is the only AI flow today, and its only seam — the `AiCardGenerator` port — is shaped around "give me card drafts" rather than around the actual external system, the LLM provider (OpenRouter). The adapter behind it hand-rolls structured output (substring-scan for the first `{...}` then `JSON.parse`) and pins a single free model. With more AI flows planned (link-context extraction, unique-card improvement), every one would re-implement the same provider plumbing, and the brittle parsing plus single-model pinning makes free-tier generation fail more than it should. We want one reusable, hardened provider seam before that duplication lands.

## What Changes

- Introduce a capability-shaped port `LlmClient` with a single `generateStructured<T>({ system, user, schema, temperature? }) → Result<T>` method (a discriminated-union result, ADR-006). This is the reusable seam every AI flow will build on.
- Add `OpenRouterLlmClient`, the single AI adapter, which concentrates free-tier reliability work:
  - Native structured output (langchain v1 `withStructuredOutput`) **with** the existing parse-and-validate fallback retained for models that do not support `json_schema`/tool-calling.
  - An OpenRouter model **fallback chain** (`models: [primary, …fallbacks]`) plus throughput-based provider routing, replacing the single pinned model.
  - One **repair retry**: on schema-validation failure, feed the validation error back once and ask the model to correct it before giving up.
  - Per-call temperature so extraction-style calls can run cooler than generative drafting.
  - Provider failures mapped to safe `Result` error categories; raw provider/model errors are never returned to the client or logged (ADR-006, SOC2).
- Re-base `GenerateCardDrafts` directly on `LlmClient` + the existing domain `buildGenerationPrompt` and `validateDrafts`; co-locate the response schema in a new `features/ai/domain/draft-schema.ts`.
- **BREAKING (internal):** remove the `AiCardGenerator` port and `OpenRouterCardGenerator` adapter; update the composition root (`getAiCardGenerator` → `getLlmClient`) and re-target AI integration tests onto a fake `LlmClient`. No user-facing behavior changes and no public API changes.

## Capabilities

### New Capabilities
- `llm-client`: a generic, server-side structured-completion seam over the LLM provider — schema-validated structured output with a parse fallback, a model fallback chain, a single repair retry, per-call temperature, and safe provider-error mapping. Reusable by all current and future AI flows.

### Modified Capabilities
- `ai-card-generation`: generation now resolves the provider through the generic `llm-client` capability instead of a card-specific generator; malformed-output handling gains one schema-repair retry and a model fallback chain before a draft set is treated as a provider failure.

## Impact

- **Ports:** add `src/ports/llm-client.ts`; remove `src/ports/ai-card-generator.ts`.
- **Adapters:** add `src/adapters/ai/openrouter-llm-client.ts`; remove `src/adapters/ai/openrouter-card-generator.ts`; extend `src/adapters/ai/config.ts` with the fallback model list and provider-routing config.
- **Features:** modify `src/features/ai/use-cases/generate-card-drafts.ts`; add `src/features/ai/domain/draft-schema.ts`. Prompt-builder and draft-validator domain modules are unchanged.
- **Composition root:** replace `getAiCardGenerator` with `getLlmClient` and rewire `getGenerateCardDrafts`.
- **Tests:** re-target AI integration tests to a fake `LlmClient`; prompt-builder and draft-validator unit tests stay as-is; add adapter coverage for the structured-output fallback and repair-retry paths.
- **Dependencies:** none added — uses the already-installed `langchain` / `@langchain/openai` / `zod`. The server-side-only `OPENROUTER_API_KEY` handling is unchanged.
- **Out of scope (deferred to later changes):** `ContentFetcher`/link-reading and the link-detection branch, `ImproveCards`/`AiCardImprover`, and any LangGraph or agentic tool-calling. The port intentionally exposes no tool surface (YAGNI); agentic tool-calling would be a separate future ADR.

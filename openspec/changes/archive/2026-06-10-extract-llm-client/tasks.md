## 1. LlmClient port

- [x] 1.1 Add `src/ports/llm-client.ts` defining `LlmResult<T>` (discriminated union: `{ ok: true; data: T } | { ok: false; error: "malformed" | "provider_unavailable" | "timeout" }`) and the `LlmClient` interface with `generateStructured<T>({ system: string; user: string; schema: ZodSchema<T>; temperature?: number }): Promise<LlmResult<T>>`. No tool surface.

## 2. Config

- [x] 2.1 Extend `src/adapters/ai/config.ts`: add an ordered `models: string[]` (primary + env-overridable fallbacks, head = current `DEFAULT_MODEL`) and provider-routing config (`provider.sort.by = "throughput"`) to `AiConfig`/`getAiConfig`, keeping server-side-only key handling and the existing timeout.

## 3. OpenRouterLlmClient adapter

- [x] 3.1 Add `src/adapters/ai/openrouter-llm-client.ts` implementing `LlmClient`; construct `ChatOpenAI` with the model fallback chain + provider routing via `modelKwargs` and per-call temperature.
- [x] 3.2 Implement native structured output (langchain v1 `withStructuredOutput(schema)`) with the parse-and-validate fallback (reuse the `extractJson` + `safeParse` approach) for models lacking native support; validate the candidate against the schema either way.
- [x] 3.3 Implement the single schema-repair retry: on validation failure, re-issue once feeding back the validation error; a second failure returns `{ ok: false, error: "malformed" }`.
- [x] 3.4 Map provider exceptions/timeouts to `provider_unavailable` / `timeout`; never return or log raw provider errors, prompts, or pasted user content.

## 4. AI feature domain

- [x] 4.1 Add `src/features/ai/domain/draft-schema.ts` holding the drafts response Zod shape (moved out of `openrouter-card-generator.ts`); leave `prompt-builder.ts` and `draft-validator.ts` unchanged.

## 5. Re-base the use case

- [x] 5.1 Change `GenerateCardDrafts` to depend on `LlmClient` instead of `AiCardGenerator`; build the prompt via `buildGenerationPrompt`, pass the draft schema, call `generateStructured`, and run `validateDrafts` on success.
- [x] 5.2 Map `LlmResult` failures through the existing `mapGenerateError`/`GenerateDraftsResult` path so the web contract is unchanged; an empty valid-draft set still yields the existing empty-result outcome.

## 6. Composition root

- [x] 6.1 Replace `getAiCardGenerator` with `getLlmClient` (returns `new OpenRouterLlmClient()`) and rewire `getGenerateCardDrafts` to inject the `LlmClient`.

## 7. Remove the old seam

- [x] 7.1 Delete `src/ports/ai-card-generator.ts` and `src/adapters/ai/openrouter-card-generator.ts`; confirm no remaining imports of `AiCardGenerator`/`OpenRouterCardGenerator`.

## 8. Tests and verification

- [x] 8.1 Re-target AI integration tests to a fake `LlmClient` returning `{ ok: true, data: { drafts: [...] } }`; keep prompt-builder and draft-validator unit tests as-is.
- [x] 8.2 Add adapter-level tests for the structured-output parse fallback and the repair-retry paths (success-after-repair and exhausted-repair → `malformed`).
- [x] 8.3 Run static checks (types, lint, boundary rule) and the test suite; confirm green.

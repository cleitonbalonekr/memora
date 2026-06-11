## MODIFIED Requirements

### Requirement: Drafts follow the effective-flashcard rules

The system SHALL prompt the model with the effective-flashcard rules so each draft is short, single-concept, and question-first. The prompt SHALL be built from a JSON-structured system and user prompt, and the model response SHALL be requested as a structured payload validated against a schema. Generation SHALL resolve the provider through the generic `llm-client` capability rather than a card-specific generator: the prompt and response schema are built in the AI feature's domain and passed to `LlmClient.generateStructured`, which owns the structured-output strategy, the model fallback chain, and the single schema-repair retry.

#### Scenario: Prompt encodes flashcard rules

- **WHEN** the system builds the generation prompt
- **THEN** the prompt instructs the model to produce short, single-concept, question-first cards within the per-side character cap

#### Scenario: Generation resolves the provider through the llm-client capability

- **WHEN** the generation use case runs
- **THEN** it builds the prompt and response schema in the AI feature domain and calls `LlmClient.generateStructured`
- **AND** it does not depend on a card-specific generator port or parse raw provider output itself

#### Scenario: Malformed model output is rejected after a repair attempt

- **WHEN** the model returns a response that does not match the expected structured schema
- **THEN** the `llm-client` capability attempts a single schema-repair retry, and if that also fails the system treats the result as a provider error and returns a safe failure result rather than passing unvalidated data downstream

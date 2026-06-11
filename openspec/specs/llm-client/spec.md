# llm-client Specification

## Purpose

Provide a generic, capability-shaped port and adapter for structured LLM completions so that any feature can obtain schema-validated data from a language model without binding to a specific provider SDK or parsing raw model output.

## Requirements

### Requirement: Generic structured-completion port

The system SHALL provide a capability-shaped port `LlmClient` exposing a single method `generateStructured<T>(input)` where `input` carries a system prompt, a user prompt, a schema describing the expected output shape, and an optional temperature. The method SHALL return a typed discriminated-union result that is either a success carrying schema-valid data of type `T` or a failure carrying a safe error category. The port SHALL NOT expose any tool-calling or agent surface.

#### Scenario: Use case obtains structured data through the port

- **WHEN** a use case calls `generateStructured` with a system prompt, user prompt, and schema
- **THEN** it receives a success result whose data conforms to the supplied schema
- **AND** the use case never parses raw provider output itself

#### Scenario: Per-call temperature is honored

- **WHEN** a caller supplies a temperature for a structured-completion call
- **THEN** that temperature is used for the request rather than a single fixed value

### Requirement: Structured output with a parse-and-validate fallback

The adapter SHALL request structured output natively from the provider, and SHALL retain a parse-and-validate fallback for models that do not support native structured output (`json_schema` or tool-calling). Whichever path produces the candidate output, the adapter SHALL validate it against the supplied schema before returning success.

#### Scenario: Native structured output succeeds

- **WHEN** the selected model supports native structured output and returns schema-valid data
- **THEN** the adapter returns a success result with the validated data

#### Scenario: Fallback parses a non-native response

- **WHEN** a model returns its answer as text rather than native structured output
- **THEN** the adapter extracts and parses the payload and validates it against the schema before returning

### Requirement: Model fallback chain and provider routing

The adapter SHALL be configured with a primary model and an ordered list of fallback models, and SHALL use the provider's routing so that when the primary model is unavailable or rate-limited the request is served by the next available model. Configuration SHALL be read from server-side environment only.

#### Scenario: Primary model unavailable

- **WHEN** the primary model is rate-limited or unavailable
- **THEN** the request is served by the next model in the configured fallback chain
- **AND** a successful result is still returned when any model in the chain responds validly

### Requirement: Single schema-repair retry

When the first candidate output fails schema validation, the adapter SHALL make exactly one corrective retry that includes the validation error and asks the model to return a corrected payload. If the retry also fails validation, the adapter SHALL return a malformed-output failure.

#### Scenario: Repair retry recovers a near-miss

- **WHEN** the first response fails schema validation but is otherwise close
- **THEN** the adapter retries once feeding back the validation error
- **AND** returns success if the corrected response validates

#### Scenario: Repair retry exhausted

- **WHEN** both the initial response and the single repair retry fail schema validation
- **THEN** the adapter returns a malformed-output failure result and does not retry further

### Requirement: Safe provider-error mapping and server-side key

The adapter SHALL map provider failures to safe error categories (for example malformed output, provider unavailable, and timeout) and SHALL NOT return or log raw provider or model error payloads, prompts, or pasted user content. The provider API key SHALL be read only from a server-side environment variable and SHALL never be exposed to the browser or included in the client bundle.

#### Scenario: Provider error is mapped, not leaked

- **WHEN** the provider returns an error or the call times out
- **THEN** the adapter returns a failure result with a safe error category
- **AND** no raw provider error, prompt, or user content is returned to the client or written to logs

#### Scenario: API key stays server-side

- **WHEN** the structured-completion adapter is constructed and used
- **THEN** the provider API key is read only from a server-side environment variable and is never exposed to the client

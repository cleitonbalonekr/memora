## ADDED Requirements

### Requirement: Per-card and per-request output caps

The system SHALL cap AI output to control cost and keep drafts well-formed. Each draft side SHALL respect the shared per-side character cap, and each generation request SHALL return at most a fixed maximum number of drafts.

#### Scenario: Request output count is bounded

- **WHEN** the model returns more drafts than the per-request maximum
- **THEN** the system returns at most the configured maximum number of drafts

#### Scenario: Per-card length enforced

- **WHEN** a generated draft side would exceed the hard per-side cap
- **THEN** that side is rejected by the draft validator and not surfaced as a saveable draft

### Requirement: Per-user rate limiting on generation

The system SHALL rate-limit AI generation requests per user within a time window. When a user exceeds the limit, the system SHALL reject further generation requests with a clear, safe message until the window resets, without calling the AI provider.

#### Scenario: Within the limit

- **WHEN** a user makes generation requests below the configured per-window limit
- **THEN** each request is processed normally

#### Scenario: Over the limit

- **WHEN** a user exceeds the configured per-window generation limit
- **THEN** the system returns a rate-limited result, does not call the AI provider, and tells the user when they can try again

### Requirement: Safe failure and no leaking of internals

The system SHALL never return raw provider or model errors to the client. Provider failures SHALL be logged server-side (without secrets or PII) and surfaced to the user as a safe, generic message.

#### Scenario: Provider error surfaced safely

- **WHEN** the AI provider call fails or times out
- **THEN** the system logs the detail server-side and returns a generic "could not generate, try again" result to the client

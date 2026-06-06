# ai-card-generation Specification

## Purpose

Provide a server-side capability that turns a user-supplied topic or pasted notes into a set of well-formed flashcard drafts for a chosen deck, applying the effective-flashcard rules and keeping the AI provider key server-side.

## Requirements

### Requirement: Generate card drafts from a topic or notes

The system SHALL provide a server-side use case that accepts a topic or pasted notes plus a target deck id and returns a set of flashcard drafts. The generation call SHALL run only on the server, and the AI provider API key SHALL never be exposed to the browser or included in the client bundle.

#### Scenario: User submits a topic and receives drafts

- **WHEN** an authenticated user submits a non-empty topic or notes for a deck they own
- **THEN** the system returns a list of card drafts, each with a `frontText` and `backText`

#### Scenario: API key stays server-side

- **WHEN** the AI generation use case runs
- **THEN** the OpenRouter API key is read only from a server-side environment variable and is never returned to the client or logged

### Requirement: Drafts follow the effective-flashcard rules

The system SHALL prompt the model with the effective-flashcard rules so each draft is short, single-concept, and question-first. The prompt SHALL be built from a JSON-structured system and user prompt, and the model response SHALL be requested as a structured (JSON) payload validated against a schema.

#### Scenario: Prompt encodes flashcard rules

- **WHEN** the system builds the generation prompt
- **THEN** the prompt instructs the model to produce short, single-concept, question-first cards within the per-side character cap

#### Scenario: Malformed model output is rejected

- **WHEN** the model returns a response that does not match the expected structured schema
- **THEN** the system treats it as a provider error and returns a safe failure result rather than passing unvalidated data downstream

### Requirement: Drafts are validated against card rules before review

The system SHALL validate every generated draft against the shared card rules (the same length cap used by the manual editor). Drafts that exceed the hard per-side cap SHALL be excluded or trimmed before being returned for review, so a user never sees a draft that cannot be saved.

#### Scenario: Oversized draft is filtered

- **WHEN** the model returns a draft whose front or back exceeds the hard per-side character cap
- **THEN** that draft is not returned in the reviewable set

#### Scenario: Empty result is reported

- **WHEN** generation produces no valid drafts
- **THEN** the system returns an empty-result outcome that the UI can surface as "no drafts generated, try again"

### Requirement: Input is validated and ownership enforced

The system SHALL validate the topic/notes input at the boundary (non-empty, within a maximum length) and SHALL reject generation requests for a deck the user does not own.

#### Scenario: Empty input rejected

- **WHEN** a user submits empty or whitespace-only topic/notes
- **THEN** the system returns an invalid-input result and does not call the AI provider

#### Scenario: Generation for another user's deck rejected

- **WHEN** a user requests drafts for a deck they do not own
- **THEN** the system returns a not-found result and does not reveal the deck's existence

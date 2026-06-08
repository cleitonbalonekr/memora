## ADDED Requirements

### Requirement: Use cases are classes with a single execute method

Every backend use case SHALL be implemented as a class exposing exactly one public method, `execute(input)`, that performs the user action and returns its result. Dependencies (ports such as repositories, the auth gateway, the AI generator, the rate limiter) SHALL be supplied through the class constructor. Runtime input (form data, identifiers, free text) SHALL be supplied through `execute`. A use case MUST NOT receive a dependency through `execute`, nor runtime input through its constructor.

#### Scenario: Command use case separates wiring from invocation

- **WHEN** a caller needs to run a command such as creating a deck
- **THEN** it obtains the use case from the composition root and calls `execute(input)` with only the runtime input
- **AND** the use case's dependencies were bound at construction, not passed by the caller

#### Scenario: Multiple runtime arguments are bundled into one input object

- **WHEN** a use case needs more than one runtime value (for example a deck id and form data)
- **THEN** `execute` accepts a single typed input object containing those values
- **AND** the caller passes one object rather than a positional argument list

### Requirement: Shared base hierarchy provides the use-case lifecycle

The system SHALL provide a minimal `UseCase<I, O>` base defining the `execute(input: I): Promise<O>` contract, and an `AuthedUseCase<I, O>` base that accepts the auth gateway via its constructor, resolves the current user inside `execute`, and delegates to an abstract `handle(user, input)` method implemented by each concrete use case. The repeated lifecycle of resolving the current user, running the action, and mapping errors SHALL live in the base, not be duplicated in each use case.

#### Scenario: Authenticated use case runs through the base lifecycle

- **WHEN** an `AuthedUseCase` subclass `execute` is called
- **THEN** the base resolves the current user before invoking `handle`
- **AND** the concrete use case's `handle` receives the resolved user and the input
- **AND** the concrete use case does not itself re-implement user resolution

#### Scenario: Session-establishing use cases do not require a current user

- **WHEN** the use case is one that establishes a session (register, log in, log out)
- **THEN** it extends the plain `UseCase` base instead of `AuthedUseCase`
- **AND** it does not attempt to resolve a current user before running

#### Scenario: Read use cases return bare values without forced error mapping

- **WHEN** a read use case (such as listing decks or fetching a card) executes
- **THEN** it returns the bare value (for example a list of decks)
- **AND** the authenticated try/catch error-mapping lifecycle is not forced upon it; errors propagate

### Requirement: Identity is resolved server-side and never trusted from the client

The current user's identity SHALL be resolved server-side inside `AuthedUseCase` from the signed, `httpOnly` session cookie via the auth gateway. The system MUST NOT accept the acting user's identity from any client-supplied source — including React Context, request bodies, query parameters, headers, or form fields. Per-user ownership checks SHALL rely only on this server-resolved identity. This enforces ADR-006 (per-user ownership on every read and write) and SOC2 least privilege.

#### Scenario: Client-supplied user identity is ignored

- **WHEN** a request carries a user identifier in its payload, headers, or form fields
- **THEN** the use case ignores that value for authorization
- **AND** it uses only the user resolved server-side from the session cookie

#### Scenario: Ownership is enforced with the server-resolved user

- **WHEN** an authenticated use case reads or writes a deck or card
- **THEN** the ownership check uses the server-resolved user id
- **AND** a request acting on another user's resource is rejected as not found or unauthorized

### Requirement: Use cases are instantiated per call in the composition root

The composition root SHALL expose one factory function per use case that constructs a fresh use-case instance on every call, binding freshly resolved dependencies. The system MUST NOT cache a use-case instance at module scope, because the auth gateway is request-scoped (it reads per-request cookies); a cached instance would bind a stale gateway and leak data across users. Callers in the web layer SHALL obtain use cases only through these factories.

#### Scenario: Each call gets a fresh instance with a request-scoped gateway

- **WHEN** the web layer requests a use case from the composition root
- **THEN** a new use-case instance is constructed
- **AND** it is bound to a freshly resolved, request-scoped auth gateway

#### Scenario: No module-level cached use-case instance

- **WHEN** the composition root is reviewed
- **THEN** no authenticated use-case instance is stored at module scope and reused across requests

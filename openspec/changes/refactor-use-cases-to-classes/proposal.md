## Why

Today every use case is a function that receives its dependencies as trailing arguments, so each call site has to know and pass the plumbing. Pages and server actions read like `listDecks(getAuthGateway(), getDeckRepository())` and `createDeck(formData, getAuthGateway(), getDeckRepository())` — runtime input (`formData`, `deckId`) is mixed into the same flat argument list as injected dependencies. This couples callers to the dependency graph, makes the wiring noisy, and gives no shared home for the cross-cutting lifecycle (resolve current user → run → map errors) that nearly every use case repeats by hand.

We want one uniform, class-based backend pattern: dependencies enter through the constructor, runtime input enters through a single `execute()` method, and the composition root assembles each use case behind a factory. This cleans the call sites, centralizes wiring, removes the repeated auth/error boilerplate, and gives a recognizable shape that future cross-cutting patterns (logging, timing, transactions) can hook into.

## What Changes

- **BREAKING (internal API):** Every use case becomes a class with a single public `execute(input)` method instead of an exported function. Call sites change from `useCase(args, ...deps)` to `getUseCase().execute(input)`.
- Introduce an abstract base hierarchy in `shared`:
  - `UseCase<I, O>` — minimal contract: `execute(input: I): Promise<O>`.
  - `AuthedUseCase<I, O>` — takes `AuthGateway` in its constructor, resolves the current user inside `execute()` via `requireCurrentUser`, then delegates to an abstract `handle(user, input)`. The repeated auth + try/catch + error-mapping lifecycle lives here, written once.
- The three session-establishing use cases (`RegisterUser`, `LoginUser`, `LogoutUser`) extend the plain `UseCase` base, **not** `AuthedUseCase`, because no current user exists yet.
- Read use cases (`ListDecks`, `ListCards`, `GetDeck`, `GetCard`) return bare values and let errors propagate — the `try/catch`/`mapError` lifecycle is not forced on them.
- Per-feature error mapping (`mapCardError`, `mapDeckError`, …) stays per feature via an overridable `mapError`; inheritance depth is kept minimal to honor the lean principle.
- Multi-argument runtime inputs (e.g. `UpdateDeck` needing `deckId` + `formData`) are bundled into a single typed input object passed to `execute()`.
- The composition root exposes one **per-call factory** per use case (e.g. `getCreateDeck()`, `getListDecks()`) that does `new UseCase(getAuthGateway(), getRepo())` on every call — never a cached module-level instance.
- **Security constraint, made explicit:** the current user is resolved server-side inside `AuthedUseCase` from the signed `httpOnly` session cookie and is **never** accepted from client-supplied input (React Context, request payload, etc.). This is recorded as a binding requirement, not just a code comment.
- Update `docs/architecture-and-rules.md` (ADR-002 and the target structure) and `AGENTS.md`, which currently mandate transaction-script **functions**, so the documented architecture matches the new class pattern.

## Capabilities

### New Capabilities
- `backend-use-case-architecture`: Defines the required structure for backend use cases — the class/`execute` shape, the `UseCase` / `AuthedUseCase` base hierarchy, the three plain-base exceptions, per-call factory instantiation in the composition root, and the server-side-only identity-resolution security rule.

### Modified Capabilities
<!-- None. The AI capability specs (ai-card-generation, ai-draft-review, ai-generation-guardrails) describe externally observable behavior, which is unchanged by this refactor — only the internal implementation shape changes. -->

## Impact

- **Use cases (~20 files):** `features/{auth,decks,cards,study,ai}/use-cases/*` rewritten as classes.
- **Shared:** new `shared` base classes (`UseCase`, `AuthedUseCase`).
- **Composition root (`src/composition-root.ts`):** add ~20 per-call factories that `new` each use case with its resolved dependencies.
- **Web layer (~10 files):** pages and server actions under `src/app/**` switch to `getUseCase().execute(input)`.
- **Tests (~15 integration/unit files):** call sites change to `new UseCase(...fakes).execute(input)`.
- **Docs:** `docs/architecture-and-rules.md` (ADR-002, target structure) and `AGENTS.md` amended.
- **Unchanged:** all `src/ports/*` interfaces and all `src/adapters/*` (adapters are already classes with constructor injection).

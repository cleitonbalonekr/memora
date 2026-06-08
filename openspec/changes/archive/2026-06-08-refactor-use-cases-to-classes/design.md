## Context

The app follows light hexagonal architecture (ADR-003): ports are interfaces, adapters are classes with constructor injection, and the composition root (`src/composition-root.ts`) binds them. Adapters and the root already use classes and per-scope factories. The remaining layer — use cases — are plain exported functions that take dependencies as trailing arguments. Call sites therefore mix runtime input with dependency wiring:

```
listDecks(getAuthGateway(), getDeckRepository())
createDeck(formData, getAuthGateway(), getDeckRepository())
updateDeck(deckId, formData, getAuthGateway(), getDeckRepository())
```

Each authenticated use case also repeats the same opening (`const user = await requireCurrentUser(authGateway)`) and, for commands, a `try/catch` that calls a feature-specific error mapper.

Current ADR-002 explicitly prescribes transaction-script **functions** for use cases. This change deliberately revises that decision, so the docs must move with the code or a future reader will revert it.

Constraint that dominates the design: `getAuthGateway()` is **request-scoped** — `SupabaseAuthGateway` reads per-request cookies, so the composition root returns a fresh instance per call and never a singleton. Any use-case instance that closes over a gateway is therefore also request-scoped.

## Goals / Non-Goals

**Goals:**
- One uniform backend shape: `getUseCase().execute(input)`, dependencies via constructor, runtime input via `execute`.
- Remove the repeated `requireCurrentUser` + `try/catch` + error-map boilerplate by hoisting it into a base class.
- Centralize wiring in the composition root behind per-use-case factories; clean up pages and actions.
- Make the "identity is server-resolved, never client-supplied" rule a written, enforceable requirement.
- Keep the documented architecture (ADR-002, target structure, AGENTS.md) consistent with the code.

**Non-Goals:**
- No change to ports (interfaces stay) or adapters (already classes).
- No change to externally observable behavior of any feature, including the AI capabilities.
- No new cross-cutting infrastructure (logging/timing/transaction decorators) — the base class merely makes them possible later.
- No introduction of a DI container or service locator; wiring stays explicit in the composition root.
- No deep inheritance trees beyond what the lifecycle needs.

## Decisions

### D1: Two-level base hierarchy — `UseCase` and `AuthedUseCase`

```
            UseCase<I, O>                 // contract only
            └─ execute(input: I): Promise<O>
                 │
                 ├── AuthedUseCase<I, O>            // ctor(auth); execute resolves user, try/catch, mapError; abstract handle(user, input)
                 │      ├── command use cases  (return result unions; override mapError)
                 │      └── read use cases     (return bare values; see D4)
                 │
                 └── plain UseCase implementers     // RegisterUser, LoginUser, LogoutUser (no current user yet)
```

`AuthedUseCase.execute` does: resolve user → `handle(user, input)` → on throw, `mapError`. Concrete use cases implement only `handle`.

**Rationale:** the auth+error lifecycle is the one genuinely shared behavior across most use cases; a base class is the place classes beat closures. Alternatives considered: (a) keep functions + a higher-order `withAuth` wrapper — rejected because the user wants a uniform class convention and a hook point for future patterns; (b) a single mega-base forcing auth on everyone — rejected because register/login/logout have no user and reads don't map errors.

### D2: Three session-establishing use cases extend the plain base

`RegisterUser`, `LoginUser`, `LogoutUser` call `authGateway.signUp/signIn/signOut`; no user exists pre-session, so they extend `UseCase`, take `AuthGateway` (and `UserRepository` where needed) in their constructor, and implement `execute` directly. Forcing them through `AuthedUseCase` would make `requireCurrentUser` throw.

### D3: Single typed input object for `execute`

`execute(input: I)` takes one argument. Single-value use cases use the natural type (`FormData`, or `void` for `ListDecks`); multi-value ones use an object: `UpdateDeck` → `{ deckId: string; formData: FormData }`. Keeps a uniform one-parameter signature at the cost of a small object literal at call sites. Alternative (variadic `execute(...args)`) rejected: it breaks the generic `UseCase<I, O>` contract and the uniform shape.

### D4: Reads bypass the command lifecycle

`ListDecks`, `ListCards`, `GetDeck`, `GetCard` return bare values (`Deck[]`, `Card | null`, …) and let errors propagate. They still need the server-resolved user for ownership, so they extend `AuthedUseCase` but `handle` simply returns the repository result and `mapError` is a passthrough/rethrow. This keeps user resolution shared without inventing a separate "authed-read" base (avoids inheritance bloat per the lean principle).

### D5: Per-feature `mapError` via overridable method

`mapError(error): O` is defined on `AuthedUseCase` (default: rethrow) and overridden by command use cases to call the existing `mapCardError` / `mapDeckError` / etc. We do **not** introduce per-feature intermediate base classes (e.g. `CardUseCase`) yet — only two use cases per feature would share a mapper, below the rule-of-three, and it would add a third inheritance level. Revisit if a feature grows many commands.

### D6: Composition root exposes per-call factories

```ts
export function getCreateDeck() { return new CreateDeck(getAuthGateway(), getDeckRepository()); }
export function getListDecks() { return new ListDecks(getAuthGateway(), getDeckRepository()); }
// ...one per use case. Always `new` per call — never a module-level cached instance.
```

Stateless dependencies (repositories) remain shared singletons inside the root as today; only the use-case object and the request-scoped gateway are created per call (cheap, throwaway). Call sites become `await getCreateDeck().execute(formData)`.

### D7: Identity is server-resolved only — security invariant

The current user is obtained inside `AuthedUseCase` via `requireCurrentUser(this.auth)`, which reads the signed `httpOnly` Supabase session cookie server-side. Identity is never read from client-supplied input. React Context was considered and rejected: (1) it is a client-render construct that Server Components and Server Actions cannot read, so it cannot serve the exact call sites in question; (2) any client-sent identity is forgeable, enabling impersonation and cross-user access — a direct violation of ADR-006 and SOC2 least privilege. To avoid a duplicate cookie read within one request, the resolution may be wrapped in React `cache()` as an optional optimization; this changes performance only, not the trust model.

### D8: Documentation moves with the code

Amend ADR-002 (the function-vs-class table and "transaction script" prescription), the target-structure note in `docs/architecture-and-rules.md`, and any function-oriented wording in `AGENTS.md`, so the documented architecture matches the class pattern and is not reverted by a future reader.

## Risks / Trade-offs

- **[Contradicts existing ADR-002] →** Update ADR-002 and AGENTS.md in the same change (D8); record the revision rationale so the decision is intentional, not accidental drift.
- **[Cached use-case instance reintroduces request-scope bug] →** Spec requirement forbids module-scope use-case instances; factories always `new`. Call out explicitly in code comments and in the composition root review.
- **[Inheritance creep — base classes accreting responsibilities] →** Keep the hierarchy to two levels (D1); no per-feature base classes until the rule-of-three is met (D5).
- **[Large blast radius — ~20 use cases + ~10 web files + ~15 tests at once] →** The integration tests are the safety net: they assert behavior (ownership, validation, persistence) and are converted alongside, so a green suite confirms behavior is preserved. Convert one vertical slice (decks) first as the reference implementation, then replicate.
- **[`void`/no-input use cases awkward under `execute(input: I)`] →** Allow `I = void`; `execute()` with no argument is acceptable for `ListDecks`/`LogoutUser`.
- **[Server Action export shape] →** Next.js `"use server"` files must export async functions, not class instances; action files keep thin wrapper functions that call `getUseCase().execute(...)`. No behavior change.

## Migration Plan

1. Add `UseCase` and `AuthedUseCase` bases under `src/shared/`.
2. Convert the `decks` slice end-to-end (use cases → composition-root factories → `page.tsx`/`actions.ts` → tests) as the reference pattern; get the suite green.
3. Replicate across `cards`, `study`, `ai`, then `auth` (plain-base exceptions).
4. Update `docs/architecture-and-rules.md` (ADR-002 + target structure) and `AGENTS.md`.
5. Run lint (including the boundary rule) and the full test suite; confirm no behavior change.

Rollback: the change is internal and mechanical; revert by VCS if the suite regresses. No data or schema changes are involved.

## Open Questions

- Naming of the no-input case: `execute()` vs `execute(undefined)` — settle a lint-friendly convention during the decks slice.
- Whether to adopt React `cache()` for `requireCurrentUser` now (D7) or defer as a follow-up optimization.

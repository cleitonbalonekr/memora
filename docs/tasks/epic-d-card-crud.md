# Epic D — Card CRUD: execution plan

Status: Ready for build
Owner: [assign]
Last updated: 2026-06-03
References:
- PRD `docs/prd.md` → Epic D (D1–D4), functional reqs "Card management (CRUD)"
- `docs/architecture-and-rules.md` → ADR-001/002/003/005/006, "card rules: length cap, single-concept hints", Testing Trophy, DoD
- Design: `docs/design/deck_management/` + `deck_management_mobile/` (card list, Front/Back layout, Add Card + per-card edit), `docs/design/DESIGN.md` (tokens)
- Depends on: Epic C (C2 — deck view exists and owns the card-list section)

---

## 1. Goal & scope

Inside a deck the owner can create, list/view, update, and delete cards (front = question/prompt, back = answer), with **light guidance toward short, single-concept, question-first cards**. Every operation is scoped to the deck's owner.

In scope: D1 create, D2 list & view, D3 update, D4 delete (with confirmation).
Out of scope: study mode (Epic E), AI drafting (Epic F). The card length cap defined here is the single source of truth the AI draft validator (F) will reuse — define it once (DRY, architecture §DRY).

---

## 2. Current state (what already exists — do not rebuild)

| Layer | Artifact | State |
|---|---|---|
| Port | `src/ports/card-repository.ts` (`CardRepository`, `Card`, `Create/UpdateCardInput`) | ✅ complete; every method takes `userId` |
| Adapter | `src/adapters/db/drizzle-card-repository.ts` | ✅ complete; ownership via deck join on every op |
| Schema | `src/adapters/db/schema.ts` (`cards`, FK → `decks` cascade) | ✅ complete |
| Wiring | `src/composition-root.ts` | ⚠️ **missing `getCardRepository`** — add it |
| Use cases / web / UI / tests | — | ❌ none yet |

**Implication:** data seam is done. Build **domain rules**, **use cases**, **server actions**, **routes**, **UI**, **card-repo integration test**, and **wire the card repository** into the composition root.

---

## 3. Where code goes (feature-first, ADR-004/005)

```
src/features/cards/
  domain/           card-rules.ts          # length caps + single-concept hints (PURE, no I/O)
                    card-rules.unit.test.ts
  use-cases/        create-card.ts, get-card.ts, list-cards.ts, update-card.ts, delete-card.ts
                    card-input.ts (parse → domain validate), card-errors.ts (result union + mapper)
                    *.integration.test.ts
  ui/              card-form.tsx, card-list.tsx, card-item.tsx,
                    delete-card-button.tsx, card-guidance.tsx, *.component.test.tsx
src/app/(app)/decks/[deckId]/
  page.tsx                         # (from Epic C) render <CardList> here
  cards/new/page.tsx               # D1 create
  cards/[cardId]/edit/page.tsx     # D3 edit
  cards/actions.ts                 # "use server" — createCardAction, updateCardAction, deleteCardAction
```

Domain (`card-rules.ts`) imports nothing from web/app/adapters (ADR-005). Use cases import domain + ports only. Actions resolve adapters from `composition-root`.

---

## 4. Decisions (defaults chosen; flag if you disagree)

1. **Cards get a real (thin) domain layer** — ADR-002 explicitly assigns Card CRUD a "small rule set (length, single concept) extracted to the domain". This is the one place in C/D with genuine rules.
2. **Card rules (named constants in `card-rules.ts`):**
   - `CARD_SIDE_MAX = 500` — hard cap per side (front/back), enforced (reject). Mirrors PRD "cap card length" + SOC2/AI cost guardrail; shared with Epic F.
   - `CARD_SIDE_RECOMMENDED = 200` — soft threshold; over it yields a non-blocking **hint** (PRD metric: 80% of sides < 200 chars). Surfaced in UI, not an error.
   - `validateCard({front, back})` → `{ errors: FieldErrors, hints: string[] }`. Errors block; hints guide.
   - Single-concept / question-first guidance is **hints only** (e.g. front not ending in "?", or containing " and "/multiple sentences → suggest splitting). Never block — guidance, per PRD "guides the user toward".
   Confirm the 500/200 numbers with design/product.
3. **Dedicated routes** for create/edit (`cards/new`, `cards/[cardId]/edit`), consistent with Epic C and auth. The `deck_management` design's inline "edit" affordance links to the edit route. (Inline modal is a later UX option.)
4. **Validation style:** manual parser `card-input.ts` returning `{ input?, fieldErrors? }` (consistent with `parse-auth-input.ts`), delegating the rule check to `card-rules.validateCard`.
5. **Result type:** `CardUseCaseResult` union (`success | invalid_input | not_found | provider_error`) in `card-errors.ts`, mirroring `auth-errors.ts`.
6. **Ownership:** every use case resolves `requireCurrentUser` and passes `user.id` to the repo, which already enforces deck-ownership via join. Non-owner deck/card → `not_found` → `notFound()` (404).
7. **Composition root:** add `import { DrizzleCardRepository }`, a shared instance, and `getCardRepository(): CardRepository` next to the deck one.

---

## 5. Task breakdown

### Pre-req — wire the card repository
- `src/composition-root.ts`: add `DrizzleCardRepository` instance + `getCardRepository()`.

### D1 — Create card (PRD: Medium)
- `domain/card-rules.ts`: constants + `validateCard` (errors + hints). Pure.
- `use-cases/card-input.ts`: `parseCardInput(formData)` → reads front/back, trims, runs `validateCard`, returns `{ input?, fieldErrors? }` (errors only; hints handled in UI).
- `use-cases/card-errors.ts`: `CardUseCaseResult` + `mapCardError`.
- `use-cases/create-card.ts`: `createCard(deckId, formData, authGateway, cardRepository)` → `requireCurrentUser` → parse → `repo.create({ deckId, front, back }, user.id)`. Repo throws if deck not owned → map to `not_found`.
- `app/(app)/decks/[deckId]/cards/actions.ts`: `createCardAction(deckId)(state, formData)` (bind `deckId`) → success `redirect('/decks/'+deckId)` + `revalidatePath`; `invalid_input` → `FormState` with fieldErrors.
- `ui/card-form.tsx`: client, `useActionState`, front textarea + back textarea, reuses field styling; shared by D1/D3 via mode + `defaultValues`. Renders `<CardGuidance>` with live hints (length counter toward 200, question-first nudge). Submit/pending states.
- `ui/card-guidance.tsx`: pure-presentation hint list (single-concept, question-first, length). Uses the same `card-rules` thresholds (DRY).
- `app/(app)/decks/[deckId]/cards/new/page.tsx`: confirms deck exists/owned (`getDeck` from Epic C), renders `CardForm` create mode.

### D2 — List & view cards (PRD: Low)
- `use-cases/list-cards.ts`: `listCards(deckId, authGateway, cardRepository)` → `requireCurrentUser` → `repo.listByDeckId(deckId, user.id)`; non-owner → `not_found`.
- `ui/card-list.tsx` + `ui/card-item.tsx`: render Front/Back per `deck_management` design (label "Front"/"Back", divider, edit affordance → edit route). Empty state ("No cards yet — add your first").
- Integrate into `app/(app)/decks/[deckId]/page.tsx` (the placeholder from Epic C becomes `<CardList>` + "Add Card" button → `cards/new`).
- `use-cases/get-card.ts`: `getCard(cardId, authGateway, cardRepository)` → `repo.findById(cardId, user.id)` → card or `not_found` (needed by D3 edit page).

### D3 — Update card (PRD: Low)
- `use-cases/update-card.ts`: `updateCard(cardId, formData, authGateway, cardRepository)` → parse → `repo.update(cardId, user.id, input)`; map repo "not found or unauthorized" → `not_found`.
- `updateCardAction(deckId, cardId)` in `cards/actions.ts` → success `redirect('/decks/'+deckId)`.
- `app/(app)/decks/[deckId]/cards/[cardId]/edit/page.tsx`: `getCard` → `notFound()` if null → `CardForm` edit mode with `defaultValues`.

### D4 — Delete card (PRD: Low)
- `use-cases/delete-card.ts`: `deleteCard(cardId, authGateway, cardRepository)` → `repo.delete(cardId, user.id)`; repo error → `not_found`.
- `deleteCardAction(deckId, cardId)` → success `revalidatePath('/decks/'+deckId)`.
- `ui/delete-card-button.tsx`: client confirm step before submit.

---

## 6. Test plan (Testing Trophy)

- **Static:** strict TS, ESLint boundary rule (domain must not import adapters), no `any`.
- **Unit (`*.unit.test.ts`):** `card-rules.unit.test.ts` is the priority —
  - over `CARD_SIDE_MAX` front/back → error; at/under → ok.
  - over `CARD_SIDE_RECOMMENDED` → length hint (no error).
  - front not question-first / multi-concept → hint; empty front/back → error.
  - `card-input` parsing (trim, required, maps rules to fieldErrors).
- **Integration (`*.integration.test.ts`, real test Postgres + `FakeAuthGateway`):**
  - `create-card` persists to an owned deck; **rejects creating into another user's deck** (`not_found`) — security test, not optional.
  - Saved card respects the length cap (assert cap enforced end-to-end — also the contract Epic F relies on).
  - `list-cards` / `get-card` return only owner's cards; non-owner → `not_found`.
  - `update-card` / `delete-card` succeed for owner, `not_found` for non-owner.
  - Add `drizzle-card-repository.integration.test.ts` for repo-level ownership (mirror the deck repo test) if not already desired — covers the join-based isolation directly.
- **Component (`*.component.test.tsx`):** `card-form` renders front/back, shows field errors from a mocked action, shows live guidance/length hint, disables submit while pending (mirror `sign-up-form.component.test.tsx`). `delete-card-button` confirms before firing.
- **E2E (Epic H, note here):** "open deck → add card → see it in list → edit → delete".

Run: `npm run test:unit`, `test:integration:setup` then `test:integration`, `test:component`.

---

## 7. Security & DoD checklist (per change)

- [ ] Ownership enforced on every read/write via `user.id` to the repo; non-owner → `not_found`/404, never another user's card.
- [ ] Input validated at boundary; rules in `card-rules` are the single source (no duplicated length numbers).
- [ ] Typed results; actions map known failures; no raw DB errors to client.
- [ ] No secrets/PII in logs; no hardcoded secrets.
- [ ] Domain layer pure (no I/O, no adapter imports) — boundary rule green.
- [ ] Focused diff, named constants, no dead/commented code.
- [ ] Tests at the right layer green; critical journey passes.

---

## 8. Suggested sequencing

1. Add `getCardRepository` to composition root.
2. `domain/card-rules.ts` (+ unit tests) — establishes the shared cap Epic F reuses.
3. `card-input.ts` + `card-errors.ts`.
4. `create-card` + action + `card-form` + `card-guidance` + `cards/new` (+ tests). → D1
5. `list-cards` + `card-list`/`card-item`, integrate into deck view; `get-card`. → D2
6. `update-card` + `cards/[cardId]/edit` (reuse `card-form`). → D3
7. `delete-card` + `delete-card-button`. → D4

Each step is independently shippable and leaves the tree green.

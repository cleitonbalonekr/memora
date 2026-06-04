# Epic C — Deck CRUD: execution plan

Status: Ready for build
Owner: [assign]
Last updated: 2026-06-03
References:
- PRD `docs/prd.md` → Epic C (C1–C4), functional reqs "Deck management (CRUD)"
- `docs/architecture-and-rules.md` → ADR-001/003/004/005/006, Testing Trophy, DoD
- Design: `docs/design/dashboard/` + `dashboard_mobile/` (deck list), `docs/design/deck_management/` + `deck_management_mobile/` (single deck view), `docs/design/DESIGN.md` (tokens)

---

## 1. Goal & scope

Let a signed-in user create, list, open, update, and delete their own decks, scoped strictly to the owner (SOC2 least privilege). Depends on Epic B (per-user isolation, route protection) — already in place.

In scope: C1 create, C2 list & view, C3 update, C4 delete (with confirmation + cascade).
Out of scope: cards inside a deck (Epic D), study mode (Epic E), AI (Epic F). The deck view page (C2) renders a cards placeholder until Epic D lands.

---

## 2. Current state (what already exists — do not rebuild)

| Layer | Artifact | State |
|---|---|---|
| Port | `src/ports/deck-repository.ts` (`DeckRepository`, `Deck`, `Create/UpdateDeckInput`) | ✅ complete, full CRUD contract |
| Adapter | `src/adapters/db/drizzle-deck-repository.ts` | ✅ complete, ownership enforced on every method |
| Schema | `src/adapters/db/schema.ts` (`decks`, cascade `onDelete` to cards) | ✅ complete |
| Adapter tests | `drizzle-deck-repository.integration.test.ts` | ✅ ownership cases covered |
| Use case | `src/features/decks/use-cases/list-decks.ts` (+ integration test) | ✅ list only |
| Web | `src/app/(app)/decks/page.tsx` (list render), `(app)/layout.tsx` (auth guard) | ✅ list page, no create/edit/delete |
| Wiring | `src/composition-root.ts` → `getDeckRepository`, `getAuthGateway` | ✅ present |

**Implication:** the data seam is done. Build the missing **use cases**, **server actions**, **routes/pages**, **UI components**, a **thin deck input parser**, and **tests**.

---

## 3. Where code goes (feature-first, ADR-004/005)

```
src/features/decks/
  use-cases/        create-deck.ts, get-deck.ts, update-deck.ts, delete-deck.ts
                    deck-input.ts (parse/validate), deck-errors.ts (result union + error mapper)
                    *.integration.test.ts, deck-input.unit.test.ts
  ui/               deck-form.tsx, deck-list.tsx, deck-card.tsx,
                    delete-deck-button.tsx, *.component.test.tsx
src/app/(app)/decks/
  page.tsx                     # C2 list (enhance existing)
  new/page.tsx                 # C1 create form
  actions.ts                   # "use server" — createDeckAction, updateDeckAction, deleteDeckAction
  [deckId]/page.tsx            # C2 single deck view (cards placeholder until Epic D)
  [deckId]/edit/page.tsx       # C3 edit form
```

Dependency direction stays inward: pages/actions → use cases → ports; use cases never import Drizzle. Actions resolve adapters via `composition-root`.

---

## 4. Decisions (defaults chosen; flag if you disagree)

1. **Dedicated routes over modals** for create/edit, mirroring the auth pages (`(auth)/sign-up`, `log-in`). Simpler server-action + page story, no client routing state. Revisit if UX wants inline modals.
2. **Validation style:** follow the existing manual parser pattern (`parse-auth-input.ts`) returning `{ input?, fieldErrors? }`, not Zod, for codebase consistency. ADR-006 names Zod only as an example. (If the team prefers Zod, swap here once and keep the same return shape.)
3. **Deck has no domain layer.** Title/description rules are thin input validation, so they live in `deck-input.ts` (use-case layer), not `domain/`. This honors ADR-002 (Deck = transaction script) — do not wrap `Deck` in a rich entity.
4. **Title/description limits (named constants, no magic numbers):** `DECK_TITLE_MAX = 80`, `DECK_DESCRIPTION_MAX = 300`, title required & non-empty after trim, description optional. Confirm exact caps with design.
5. **Delete confirmation** is a client component (`delete-deck-button.tsx`) using a native confirm dialog / small inline confirm, posting to `deleteDeckAction`. Cascade to cards is already guaranteed by the FK `onDelete: "cascade"` — no app-level fan-out needed.
6. **Result type:** add a `DeckUseCaseResult` discriminated union (`success | invalid_input | not_found | provider_error`) in `deck-errors.ts`, mirroring `auth-errors.ts`, so actions map cleanly to UI/HTTP.

Open questions for the team: exact title/description caps; whether `/decks` (list) and the dashboard stats screen are the same route for the MVP (recommend: `/decks` is the list; dashboard stats are post-MVP, ignore the streak/“due” bento for now).

---

## 5. Task breakdown

### C1 — Create deck (PRD: Low)
- `use-cases/deck-input.ts`: `parseDeckInput(formData)` → trims title, enforces required + caps, normalizes empty description to `undefined`.
- `use-cases/deck-errors.ts`: `DeckUseCaseResult` union + `mapDeckError`.
- `use-cases/create-deck.ts`: `createDeck(formData, authGateway, deckRepository)` → `requireCurrentUser` → parse → `repo.create({ userId, ... })` → typed result.
- `app/(app)/decks/actions.ts`: `createDeckAction(state, formData)` → resolve from composition root → on success `redirect('/decks/' + deck.id)`; on `invalid_input` return `FormState` with `fieldErrors`.
- `ui/deck-form.tsx`: client component, `useActionState`, reuses `FormField` pattern (title input, description textarea), submit/pending states. Shared by C1 and C3 (mode via props + optional `defaultValues`).
- `app/(app)/decks/new/page.tsx`: renders `DeckForm` in create mode.

### C2 — List & view decks (PRD: Low)
- Enhance `app/(app)/decks/page.tsx`: keep `listDecks`; extract `ui/deck-list.tsx` + `ui/deck-card.tsx` (title, description, link to `/decks/[deckId]`). Add a "New deck" entry point (button → `/decks/new`) per `dashboard` design FAB. Keep the empty-state, update copy ("Create your first deck").
- `use-cases/get-deck.ts`: `getDeck(deckId, authGateway, deckRepository)` → `requireCurrentUser` → `repo.findById(deckId, user.id)` → returns deck or `not_found`.
- `app/(app)/decks/[deckId]/page.tsx`: server component, calls `getDeck`; `notFound()` (Next) when null so a non-owner gets 404, not another user's data. Render deck header + actions (Edit, Delete) per `deck_management` design; cards section is a placeholder note until Epic D.

### C3 — Update deck (PRD: Low)
- `use-cases/update-deck.ts`: `updateDeck(deckId, formData, authGateway, deckRepository)` → parse → `repo.update(id, userId, input)`; map "not found or unauthorized" repo error to `not_found`.
- `updateDeckAction` in `actions.ts` → on success `redirect('/decks/' + id)`.
- `app/(app)/decks/[deckId]/edit/page.tsx`: loads deck via `getDeck`, renders `DeckForm` in edit mode with `defaultValues`.

### C4 — Delete deck (PRD: Medium)
- `use-cases/delete-deck.ts`: `deleteDeck(deckId, authGateway, deckRepository)` → `repo.delete(id, userId)`; map repo error → `not_found`.
- `deleteDeckAction` in `actions.ts` → on success `redirect('/decks')`, `revalidatePath('/decks')`.
- `ui/delete-deck-button.tsx`: client confirm step before submit. Cascade handled by FK.

---

## 6. Test plan (Testing Trophy)

- **Static:** strict TS, ESLint boundary rule, no `any`. First gate.
- **Unit (`*.unit.test.ts`):** `deck-input.unit.test.ts` — required title, trim, over-cap title, over-cap description, empty description → undefined. `deck-errors` mapping if non-trivial.
- **Integration (`*.integration.test.ts`, real test Postgres + `FakeAuthGateway`):**
  - `create-deck` persists scoped to current user; rejects unauthenticated; returns `invalid_input` on bad title.
  - `get-deck` returns owner's deck; returns `not_found` for another user's deck id (security test — not optional).
  - `update-deck` updates own deck; `not_found` for someone else's.
  - `delete-deck` deletes own deck and **cascades cards** (insert a card via card repo, assert gone); `not_found` for non-owner.
  - Repo ownership already covered in `drizzle-deck-repository.integration.test.ts` — don't duplicate, test through use cases.
- **Component (`*.component.test.tsx`):** `deck-form` renders fields, shows field errors from a mocked action, disables submit while pending (mirror `sign-up-form.component.test.tsx`). `delete-deck-button` requires confirmation before firing the action.
- **E2E (Epic H, note here):** "create a deck → see it in the list → open it" journey.

Run: `npm run test:unit`, `test:integration:setup` then `test:integration`, `test:component`.

---

## 7. Security & DoD checklist (per change)

- [ ] Ownership enforced on every read/write (use case passes `user.id`; repo filters by it). Non-owner → `not_found`/404, never another user's data.
- [ ] All external input validated at the boundary before the use case (ADR-006).
- [ ] Use cases return typed results; actions map known failures; no raw DB errors to client.
- [ ] No secrets/PII in logs. No hardcoded secrets.
- [ ] Focused diff, named constants, no dead/commented code, no boundary-rule violations.
- [ ] Tests at the right layer green; critical journey still passes.

---

## 8. Suggested sequencing

1. `deck-input.ts` + `deck-errors.ts` (+ unit tests).
2. `create-deck` + action + `deck-form` + `/decks/new` (+ integration & component tests). → C1
3. `get-deck` + `[deckId]/page.tsx` + extract `deck-list`/`deck-card`, enhance `/decks`. → C2
4. `update-deck` + `[deckId]/edit` (reuse `deck-form`). → C3
5. `delete-deck` + `delete-deck-button` + cascade test. → C4

Each step is independently shippable and leaves the tree green.

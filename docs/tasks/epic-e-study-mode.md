# Epic E — Study mode: execution plan

Status: Ready for build
Owner: [assign]
Last updated: 2026-06-03
References:
- PRD `docs/prd.md` → Epic E (E1–E2), functional reqs "Study mode (basic)"
- `docs/architecture-and-rules.md` → ADR-001/002 (study session = **domain logic**), ADR-005, Testing Trophy ("unit tests for the re-queue logic; integration test for stepping through a session"), DoD
- Design: `docs/design/study_mode/` (full-screen flip card, top progress bar, bottom "Review" / "Got it" actions), `docs/design/DESIGN.md` (tokens, "Study Cards" + "Primary Actions" + "Progress Bars" components)
- Depends on: Epic D (D2 — cards exist and can be listed for a deck)

---

## 1. Goal & scope

Let a signed-in owner study a deck one card at a time: see the front, reveal the back, mark **"Got it"** or **"Review again"**, and have review-again cards re-queued **within the session**. Session-only — no cross-session memory, no scheduling, no persistence (PRD non-goal; ADR-002 keeps spaced repetition as phase 2).

In scope: E1 card stepper with reveal, E2 session feedback + re-queue + a completion summary.
Out of scope: spaced repetition / due dates (phase 2), saving results, streaks/stats (the dashboard's streak bento is not MVP).

---

## 2. Current state

| Layer | Artifact | State |
|---|---|---|
| Feature dir | `src/features/study/` | exists, **empty** — greenfield |
| Cards read | `CardRepository.listByDeckId(deckId, userId)` (ownership enforced via deck join) | ✅ reuse |
| Deck read | `getDeck` use case (returns null → 404 for non-owner) | ✅ reuse for the page guard |
| Wiring | `getCardRepository`, `getDeckRepository`, `getAuthGateway` in `composition-root.ts` | ✅ present |

**Implication:** no new port, adapter, schema, or migration. Epic E is a **pure domain model** (the session + re-queue), one **thin use case** (load the owner's cards), and a **client UI** that runs the session in React state.

---

## 3. Key architectural decision — where the session lives

The session is **client-side React state driven by a pure domain model**. Rationale:

- The study session has real behavior (reveal, re-queue, completion) → ADR-002 assigns it **domain logic**, and the Testing Trophy calls out **unit tests for the re-queue logic**. So the logic is pure, framework-free functions.
- It is **session-only with no persistence** (PRD). There is nowhere server-side to keep state between cards, and round-tripping the whole session to the server per tap would be heavier and worse on mobile for zero benefit. So the domain functions run in the browser; the page seeds them with cards loaded once on the server.
- `recordResult` is therefore a **pure domain transition** (`session → session`), **not** a server action. The only server work is `startStudySession` (load the owner's cards once).

This is the lean reading of the PRD's named `startSession` / `recordResult`: model the behavior in the domain, keep the I/O boundary to a single thin use case.

---

## 4. Where code goes (feature-first, ADR-004/005)

```
src/features/study/
  domain/
    study-session.ts             # PURE: StudySession type + transitions + selectors
    study-session.unit.test.ts
  use-cases/
    start-study-session.ts       # thin: requireCurrentUser → cardRepository.listByDeckId
    start-study-session.integration.test.ts
  ui/
    study-session.tsx            # "use client" — holds session state, orchestrates
    study-card.tsx               # front/back reveal (accessible flip)
    study-progress.tsx           # top progress bar + "got it / total"
    session-complete.tsx         # end-of-session summary + restart / back-to-deck
    *.component.test.tsx
src/app/(app)/decks/[deckId]/
  study/page.tsx                 # server: getDeck (404 guard) + start-study-session → <StudySession>
```

Dependency direction: `domain` imports nothing. `start-study-session` depends on the `CardRepository` **port** + `requireCurrentUser` (mirrors `listCards`; no cross-feature import). The page composes adapters at the edge and passes plain card data into the client component.

---

## 5. Domain model (the heart of this epic)

`study-session.ts` — pure, immutable, deterministic. Proposed shape:

```ts
export type StudyOutcome = "got_it" | "review_again";

export interface StudyCard { id: string; frontText: string; backText: string; }

export interface StudySession {
  queue: StudyCard[];      // remaining cards; head is current
  revealed: boolean;       // is the back of the current card showing
  total: number;           // count of unique cards in the deck
  gotItIds: string[];      // unique cards cleared (for progress)
}

export function createSession(cards: StudyCard[]): StudySession;
export function reveal(session: StudySession): StudySession;            // show the back
export function recordResult(session: StudySession, outcome: StudyOutcome): StudySession;
// selectors
export function currentCard(session: StudySession): StudyCard | null;   // null when complete
export function isComplete(session: StudySession): boolean;             // queue empty
export function progress(session: StudySession): { completed: number; total: number };
```

**Re-queue rules (decision — flag if you disagree):**
- `recordResult(s, "got_it")`: remove the current card from the queue, add its id to `gotItIds` (once), reset `revealed` to false, advance to next.
- `recordResult(s, "review_again")`: move the current card to the **tail** of the queue, reset `revealed`. It reappears later in the same session.
- `isComplete` when `queue` is empty (every card was eventually "got it").
- `progress.completed = gotItIds.length`, `progress.total = total` → drives the design's "12 / 30" + bar.
- Initial order = **creation order** (deterministic; matches `listByDeckId`). Shuffle is an easy, optional follow-up — flagged, not built (keeps unit tests deterministic; PRD allows "reshuffles **or** re-queues").
- Empty deck → `createSession([])` is immediately `isComplete` with `total 0`; the page shows an empty state instead of mounting the runner.

`recordResult` ignores `revealed` (you can mark without revealing) — or we gate marking on reveal in the UI; domain stays permissive, UI enforces the flow.

---

## 6. Task breakdown

### E1 — Card stepper with reveal (PRD: Medium)
- `domain/study-session.ts`: `createSession`, `reveal`, `currentCard`, `isComplete`, `progress` (+ the `recordResult` skeleton finished in E2).
- `use-cases/start-study-session.ts`: `startStudySession(deckId, authGateway, cardRepository) → StudyCard[]` (requireCurrentUser → `listByDeckId(deckId, user.id)`, mapped to `StudyCard`).
- `app/(app)/decks/[deckId]/study/page.tsx`: server component — `getDeck` (→ `notFound()` if null), load cards, render `<StudySession deckId deckTitle cards />`. If `cards.length === 0`, render an empty state ("Add cards before studying" + link to the deck).
- `ui/study-card.tsx`: shows the front; reveal control shows the back. **Accessibility upgrade over the mock:** the flip is a real `<button>` (focusable, Enter/Space), the answer region uses `aria-live="polite"`; honor `prefers-reduced-motion` (skip the 3D flip animation). Design styling: full-screen card, rounded-2xl, emerald/rose accents from tokens.
- `ui/study-progress.tsx`: top bar + "completed / total" label.
- Wire entry points: "Study" / "Study Now" buttons on the deck view (`/decks/[deckId]`) and dashboard, linking to `/decks/[deckId]/study`. Disable/!show when the deck has 0 cards.

### E2 — Session feedback and re-queue (PRD: Medium)
- Finish `recordResult` in `study-session.ts` (got_it removes; review_again re-queues to tail) + full unit coverage.
- `ui/study-session.tsx` ("use client"): seed `useState(() => createSession(cards))`; render current card via `study-card`; bottom fixed actions **"Review again"** (rose/`tertiary`) and **"Got it"** (emerald/`secondary`) per design; on click call `recordResult` and update state; when `isComplete`, render `session-complete`.
- `ui/session-complete.tsx`: summary (e.g. "You cleared N cards") + "Study again" (re-seed from the original cards) and "Back to deck".

---

## 7. Test plan (Testing Trophy)

For Epic E the **unit layer carries the most weight** (pure re-queue logic), per the architecture doc.

- **Unit (`study-session.unit.test.ts`):**
  - `createSession` seeds queue in order, `revealed=false`, `total=n`, `gotItIds=[]`; empty deck → complete.
  - `reveal` sets `revealed=true` (idempotent).
  - `recordResult("got_it")` removes current, advances, records id once, resets reveal; clears session when last card.
  - `recordResult("review_again")` moves current to tail, resets reveal, card reappears after the others.
  - review_again then later got_it eventually completes; a card reviewed twice isn't double-counted in `gotItIds`.
  - `progress`/`isComplete`/`currentCard` across a full walkthrough; single-card session.
- **Integration (`start-study-session.integration.test.ts`, real test Postgres + `FakeAuthGateway`):**
  - returns the owner's cards in creation order;
  - **rejects another user's deck** (throws "not found or unauthorized") — security test, not optional;
  - empty deck → returns `[]`.
- **Component (`*.component.test.tsx`, RTL):**
  - renders the first front; activating reveal shows the back (and is keyboard-accessible);
  - "Got it" advances to the next card and moves the progress count;
  - "Review again" re-queues — the card is seen again later in the session;
  - completing all cards renders the `session-complete` summary; "Study again" restarts.
- **E2E (Epic H, noted):** register/login → open a deck with cards → run a session (reveal, mark, finish).

Run: `npm run test:unit`, `test:integration:setup` then `test:integration`, `test:component`.

---

## 8. Security & DoD checklist

- [ ] `startStudySession` enforces ownership (passes `user.id`; non-owner deck rejected). The study page also 404s via `getDeck`.
- [ ] No new external input beyond `deckId` (validated by the ownership-scoped query). No secrets/PII in logs.
- [ ] Domain layer pure (no I/O, no React, no adapter imports) — boundary rule green.
- [ ] WCAG 2.1 AA on the study flow: focusable reveal control, keyboard operable, `aria-live` answer, visible focus, reduced-motion respected, color not the only signal on the two actions (icons + labels).
- [ ] Focused diff, named constants, no dead/commented code; tests green at the right layers.

---

## 9. Suggested sequencing

1. `domain/study-session.ts` (createSession/reveal/selectors) + unit tests. → E1 core
2. `start-study-session.ts` + integration test. → E1 I/O
3. `study/page.tsx` + `study-card` + `study-progress` + deck-view "Study" entry point (empty-deck guard). → E1 UI
4. Finish `recordResult` + unit tests. → E2 core
5. `study-session.tsx` runner + "Got it"/"Review again" + `session-complete` + component tests. → E2 UI

Each step leaves the tree green and is independently shippable.

---

## 10. Open questions for the team

- **Shuffle vs. fixed order at session start?** Plan defaults to creation order (deterministic, testable); re-queue alone satisfies the PRD. Confirm if a shuffle is wanted for v1.
Lets keep the fixed order for now.
- **Re-queue distance:** tail of the queue (proposed) vs. "after N cards." Tail is simplest and works for small decks; revisit if decks are large.
- lets keep the tail for now.
- **Mark before reveal:** UI gates "Got it / Review again" until the back is revealed (proposed) — confirm that's the desired flow.
I believe we should only show it after the back is revealed.

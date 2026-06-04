import { describe, expect, it } from "vitest";
import {
  createSession,
  currentCard,
  isComplete,
  progress,
  recordResult,
  reveal,
  StudyCard,
} from "./study-session";

function cards(...ids: string[]): StudyCard[] {
  return ids.map((id) => ({ id, frontText: `front ${id}`, backText: `back ${id}` }));
}

describe("createSession", () => {
  it("seeds the queue in order with nothing revealed or cleared", () => {
    const session = createSession(cards("a", "b", "c"));

    expect(session.queue.map((card) => card.id)).toEqual(["a", "b", "c"]);
    expect(session.revealed).toBe(false);
    expect(session.total).toBe(3);
    expect(session.gotItIds).toEqual([]);
    expect(currentCard(session)?.id).toBe("a");
    expect(isComplete(session)).toBe(false);
  });

  it("treats an empty deck as immediately complete", () => {
    const session = createSession([]);

    expect(isComplete(session)).toBe(true);
    expect(currentCard(session)).toBeNull();
    expect(progress(session)).toEqual({ completed: 0, total: 0 });
  });
});

describe("reveal", () => {
  it("shows the back and is idempotent", () => {
    const once = reveal(createSession(cards("a")));
    expect(once.revealed).toBe(true);
    expect(reveal(once)).toBe(once);
  });
});

describe("recordResult got_it", () => {
  it("removes the current card, advances, and counts it once", () => {
    let session = reveal(createSession(cards("a", "b")));
    session = recordResult(session, "got_it");

    expect(currentCard(session)?.id).toBe("b");
    expect(session.revealed).toBe(false);
    expect(session.gotItIds).toEqual(["a"]);
    expect(progress(session)).toEqual({ completed: 1, total: 2 });
  });

  it("completes the session when the last card is cleared", () => {
    let session = createSession(cards("a"));
    session = recordResult(session, "got_it");

    expect(isComplete(session)).toBe(true);
    expect(progress(session)).toEqual({ completed: 1, total: 1 });
  });
});

describe("recordResult review_again", () => {
  it("moves the current card to the tail and resets the reveal", () => {
    let session = reveal(createSession(cards("a", "b", "c")));
    session = recordResult(session, "review_again");

    expect(session.queue.map((card) => card.id)).toEqual(["b", "c", "a"]);
    expect(session.revealed).toBe(false);
    expect(progress(session).completed).toBe(0);
    expect(isComplete(session)).toBe(false);
  });

  it("keeps a single re-queued card in the session", () => {
    let session = createSession(cards("a"));
    session = recordResult(session, "review_again");

    expect(currentCard(session)?.id).toBe("a");
    expect(isComplete(session)).toBe(false);
  });
});

describe("a full walkthrough", () => {
  it("eventually completes after re-queuing then clearing, without double counting", () => {
    let session = createSession(cards("a", "b"));

    // a → review again (goes to tail: [b, a])
    session = recordResult(session, "review_again");
    expect(currentCard(session)?.id).toBe("b");

    // b → got it ([a])
    session = recordResult(session, "got_it");
    expect(currentCard(session)?.id).toBe("a");

    // a → review again again ([a])
    session = recordResult(session, "review_again");
    expect(currentCard(session)?.id).toBe("a");

    // a → got it ([])
    session = recordResult(session, "got_it");

    expect(isComplete(session)).toBe(true);
    expect(session.gotItIds).toEqual(["b", "a"]);
    expect(progress(session)).toEqual({ completed: 2, total: 2 });
  });

  it("does nothing when recording with an empty queue", () => {
    const done = createSession([]);
    expect(recordResult(done, "got_it")).toBe(done);
  });
});

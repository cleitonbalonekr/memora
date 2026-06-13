import { describe, expect, it } from "vitest";
import { StudyCard, StudySession } from "./study-session";

function cards(...ids: string[]): StudyCard[] {
  return ids.map((id) => ({ id, frontText: `front ${id}`, backText: `back ${id}` }));
}

describe("StudySession.create", () => {
  it("seeds the queue in order with nothing revealed or cleared", () => {
    const session = StudySession.create(cards("a", "b", "c"));

    expect(session.currentCard()?.id).toBe("a");
    expect(session.revealed).toBe(false);
    expect(session.progress()).toEqual({ completed: 0, total: 3 });
    expect(session.isComplete()).toBe(false);
  });

  it("treats an empty deck as immediately complete", () => {
    const session = StudySession.create([]);

    expect(session.isComplete()).toBe(true);
    expect(session.currentCard()).toBeNull();
    expect(session.progress()).toEqual({ completed: 0, total: 0 });
  });
});

describe("reveal", () => {
  it("shows the back and is idempotent", () => {
    const once = StudySession.create(cards("a")).reveal();
    expect(once.revealed).toBe(true);
    expect(once.reveal()).toBe(once);
  });
});

describe.each(["hard", "good", "easy"] as const)("recordResult %s", (grade) => {
  it("removes the current card, advances, and counts it once", () => {
    const session = StudySession.create(cards("a", "b")).reveal().recordResult(grade);

    expect(session.currentCard()?.id).toBe("b");
    expect(session.revealed).toBe(false);
    expect(session.progress()).toEqual({ completed: 1, total: 2 });
  });

  it("completes the session when the last card is cleared", () => {
    const session = StudySession.create(cards("a")).recordResult(grade);

    expect(session.isComplete()).toBe(true);
    expect(session.progress()).toEqual({ completed: 1, total: 1 });
  });
});

describe("recordResult again", () => {
  it("moves the current card to the tail and resets the reveal", () => {
    const session = StudySession.create(cards("a", "b", "c")).reveal().recordResult("again");

    expect(session.currentCard()?.id).toBe("b");
    expect(session.revealed).toBe(false);
    expect(session.progress().completed).toBe(0);
    expect(session.isComplete()).toBe(false);
  });

  it("keeps a single re-queued card in the session", () => {
    const session = StudySession.create(cards("a")).recordResult("again");

    expect(session.currentCard()?.id).toBe("a");
    expect(session.isComplete()).toBe(false);
  });
});

describe("a full walkthrough", () => {
  it("eventually completes after re-queuing then clearing, without double counting", () => {
    let session = StudySession.create(cards("a", "b"));

    // a -> again (goes to tail: [b, a])
    session = session.recordResult("again");
    expect(session.currentCard()?.id).toBe("b");

    // b -> good ([a])
    session = session.recordResult("good");
    expect(session.currentCard()?.id).toBe("a");

    // a -> again again ([a])
    session = session.recordResult("again");
    expect(session.currentCard()?.id).toBe("a");

    // a -> easy ([])
    session = session.recordResult("easy");

    expect(session.isComplete()).toBe(true);
    expect(session.progress()).toEqual({ completed: 2, total: 2 });
  });

  it("does nothing when recording with an empty queue", () => {
    const done = StudySession.create([]);
    expect(done.recordResult("good")).toBe(done);
  });
});

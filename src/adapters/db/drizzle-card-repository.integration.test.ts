import { describe, expect, it } from "vitest";
import { DrizzleCardRepository } from "./drizzle-card-repository";
import { DrizzleDeckRepository } from "./drizzle-deck-repository";
import { DrizzleUserRepository } from "./drizzle-user-repository";
import { SrsState } from "@/features/study/domain/scheduler";
import { todayUtc } from "@/shared/today";

const cardRepository = new DrizzleCardRepository();
const deckRepository = new DrizzleDeckRepository();
const userRepository = new DrizzleUserRepository();

const TODAY = todayUtc();

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

async function createUser(email: string): Promise<string> {
  const id = crypto.randomUUID();
  await userRepository.createProfile({ id, email });
  return id;
}

async function setState(
  cardId: string,
  userId: string,
  partial: Partial<SrsState>,
): Promise<void> {
  await cardRepository.saveReviewState(cardId, userId, {
    intervalDays: 1,
    ease: 2500,
    reps: 1,
    lapses: 0,
    dueDate: null,
    firstReviewedAt: null,
    suspendedAt: null,
    ...partial,
  });
}

describe("DrizzleCardRepository.createMany", () => {
  it("persists all cards for an owned deck and returns them", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Biology" });

    const created = await cardRepository.createMany(
      [
        { deckId: deck.id, frontText: "What is mitosis?", backText: "Cell division." },
        { deckId: deck.id, frontText: "What is meiosis?", backText: "Gamete-forming division." },
      ],
      ownerId,
    );

    expect(created).toHaveLength(2);
    const persisted = await cardRepository.listByDeckId(deck.id, ownerId);
    expect(persisted).toHaveLength(2);
    expect(persisted.map((c) => c.frontText)).toEqual(
      expect.arrayContaining(["What is mitosis?", "What is meiosis?"]),
    );
  });

  it("returns [] and persists nothing for empty input", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Empty" });

    const created = await cardRepository.createMany([], ownerId);

    expect(created).toEqual([]);
    expect(await cardRepository.listByDeckId(deck.id, ownerId)).toHaveLength(0);
  });

  it("throws and persists nothing for a non-owned deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });

    await expect(
      cardRepository.createMany(
        [{ deckId: deck.id, frontText: "Sneaky?", backText: "No." }],
        intruderId,
      ),
    ).rejects.toThrow("Deck not found or unauthorized");

    expect(await cardRepository.listByDeckId(deck.id, ownerId)).toHaveLength(0);
  });
});

describe("DrizzleCardRepository.listDueForStudy", () => {
  it("rejects a non-owned deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });

    await expect(
      cardRepository.listDueForStudy(deck.id, intruderId, TODAY, 20),
    ).rejects.toThrow("Deck not found or unauthorized");
  });

  it("returns due reviews most-overdue first, then new cards within the limit", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });

    const lessOverdue = await cardRepository.create(
      { deckId: deck.id, frontText: "Less overdue", backText: "x" },
      ownerId,
    );
    const moreOverdue = await cardRepository.create(
      { deckId: deck.id, frontText: "More overdue", backText: "x" },
      ownerId,
    );
    const future = await cardRepository.create(
      { deckId: deck.id, frontText: "Future", backText: "x" },
      ownerId,
    );
    const suspended = await cardRepository.create(
      { deckId: deck.id, frontText: "Suspended", backText: "x" },
      ownerId,
    );
    // Two brand-new cards (dueDate null) left untouched.
    await cardRepository.create({ deckId: deck.id, frontText: "New A", backText: "x" }, ownerId);
    await cardRepository.create({ deckId: deck.id, frontText: "New B", backText: "x" }, ownerId);

    await setState(lessOverdue.id, ownerId, { dueDate: addDays(TODAY, -1), firstReviewedAt: addDays(TODAY, -3) });
    await setState(moreOverdue.id, ownerId, { dueDate: addDays(TODAY, -5), firstReviewedAt: addDays(TODAY, -8) });
    await setState(future.id, ownerId, { dueDate: addDays(TODAY, 2), firstReviewedAt: addDays(TODAY, -3) });
    await setState(suspended.id, ownerId, { dueDate: addDays(TODAY, -1), firstReviewedAt: addDays(TODAY, -3), suspendedAt: TODAY });

    const queue = await cardRepository.listDueForStudy(deck.id, ownerId, TODAY, 20);

    expect(queue.map((c) => c.frontText)).toEqual([
      "More overdue",
      "Less overdue",
      "New A",
      "New B",
    ]);
  });

  it("caps new cards at newLimit and subtracts those already introduced today", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });

    // One card already introduced today (firstReviewedAt = today), due later so
    // it is not a due review — it only consumes the new-card allowance.
    const introduced = await cardRepository.create(
      { deckId: deck.id, frontText: "Introduced", backText: "x" },
      ownerId,
    );
    await setState(introduced.id, ownerId, { dueDate: addDays(TODAY, 3), firstReviewedAt: TODAY });

    await cardRepository.createMany(
      Array.from({ length: 5 }, (_, i) => ({ deckId: deck.id, frontText: `New ${i}`, backText: "x" })),
      ownerId,
    );

    // newLimit 3, one already introduced -> only 2 new cards allowed.
    const queue = await cardRepository.listDueForStudy(deck.id, ownerId, TODAY, 3);

    expect(queue).toHaveLength(2);
    expect(queue.every((c) => c.frontText.startsWith("New "))).toBe(true);
  });
});

describe("DrizzleCardRepository.saveReviewState", () => {
  it("persists the SRS columns for an owned card", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Q", backText: "A" },
      ownerId,
    );

    await cardRepository.saveReviewState(card.id, ownerId, {
      intervalDays: 12,
      ease: 2350,
      reps: 4,
      lapses: 1,
      dueDate: addDays(TODAY, 12),
      firstReviewedAt: addDays(TODAY, -20),
      suspendedAt: null,
    });

    const persisted = await cardRepository.findById(card.id, ownerId);
    expect(persisted).toMatchObject({ intervalDays: 12, ease: 2350, reps: 4, lapses: 1 });
    expect(persisted?.dueDate).toEqual(addDays(TODAY, 12));
  });

  it("throws and changes nothing for a card the user does not own", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Q", backText: "A" },
      ownerId,
    );

    await expect(
      cardRepository.saveReviewState(card.id, intruderId, {
        intervalDays: 99,
        ease: 1300,
        reps: 9,
        lapses: 9,
        dueDate: TODAY,
        firstReviewedAt: TODAY,
        suspendedAt: TODAY,
      }),
    ).rejects.toThrow("not found or unauthorized");

    const persisted = await cardRepository.findById(card.id, ownerId);
    expect(persisted?.intervalDays).toBe(0);
    expect(persisted?.dueDate).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { StartStudySession } from "./start-study-session";
import { DrizzleCardRepository } from "@/adapters/db/drizzle-card-repository";
import { DrizzleDeckRepository } from "@/adapters/db/drizzle-deck-repository";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { SrsState } from "@/features/study/domain/scheduler";
import { todayUtc } from "@/shared/today";
import { FakeAuthGateway } from "../../../../tests/support/fake-auth-gateway";

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

function authFor(userId: string, email: string): FakeAuthGateway {
  return new FakeAuthGateway({ currentUser: { id: userId, email } });
}

describe("StartStudySession", () => {
  it("includes due reviews and excludes cards due in the future", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const due = await cardRepository.create(
      { deckId: deck.id, frontText: "Due?", backText: "yes" },
      ownerId,
    );
    const future = await cardRepository.create(
      { deckId: deck.id, frontText: "Later?", backText: "no" },
      ownerId,
    );
    await setState(due.id, ownerId, { dueDate: addDays(TODAY, -1), firstReviewedAt: addDays(TODAY, -5) });
    await setState(future.id, ownerId, { dueDate: addDays(TODAY, 1), firstReviewedAt: addDays(TODAY, -5) });

    const cards = await new StartStudySession(authFor(ownerId, "owner@example.com"), cardRepository).execute(deck.id);

    expect(cards.map((c) => c.frontText)).toEqual(["Due?"]);
  });

  it("excludes suspended cards even when they would be due", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const leech = await cardRepository.create(
      { deckId: deck.id, frontText: "Leech?", backText: "x" },
      ownerId,
    );
    await setState(leech.id, ownerId, {
      dueDate: addDays(TODAY, -1),
      firstReviewedAt: addDays(TODAY, -5),
      suspendedAt: TODAY,
    });

    const cards = await new StartStudySession(authFor(ownerId, "owner@example.com"), cardRepository).execute(deck.id);

    expect(cards).toEqual([]);
  });

  it("returns new cards capped at the remaining daily allowance (respects newToday)", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });

    // One card already introduced today (counts against the 20/day limit) and
    // due in the future, so it is not itself a due review.
    const introduced = await cardRepository.create(
      { deckId: deck.id, frontText: "Introduced", backText: "x" },
      ownerId,
    );
    await setState(introduced.id, ownerId, { dueDate: addDays(TODAY, 3), firstReviewedAt: TODAY });

    // 20 brand-new cards; only 19 should be allowed today (20 - 1 introduced).
    await cardRepository.createMany(
      Array.from({ length: 20 }, (_, i) => ({
        deckId: deck.id,
        frontText: `New ${i}`,
        backText: "x",
      })),
      ownerId,
    );

    const cards = await new StartStudySession(authFor(ownerId, "owner@example.com"), cardRepository).execute(deck.id);

    expect(cards).toHaveLength(19);
    expect(cards.every((c) => c.frontText.startsWith("New "))).toBe(true);
  });

  it("rejects studying another user's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });

    await expect(
      new StartStudySession(authFor(intruderId, "intruder@example.com"), cardRepository).execute(deck.id),
    ).rejects.toThrow("not found or unauthorized");
  });

  it("returns an empty list for a deck with no cards", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Empty" });

    expect(
      await new StartStudySession(authFor(ownerId, "owner@example.com"), cardRepository).execute(deck.id),
    ).toEqual([]);
  });
});

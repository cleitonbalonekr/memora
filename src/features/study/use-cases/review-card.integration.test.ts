import { describe, expect, it } from "vitest";
import { ReviewCard } from "./review-card";
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

function authFor(userId: string, email: string): FakeAuthGateway {
  return new FakeAuthGateway({ currentUser: { id: userId, email } });
}

async function makeReviewCard(deckId: string, userId: string, partial: Partial<SrsState>) {
  const card = await cardRepository.create(
    { deckId, frontText: "Q", backText: "A" },
    userId,
  );
  await cardRepository.saveReviewState(card.id, userId, {
    intervalDays: 10,
    ease: 2500,
    reps: 1,
    lapses: 0,
    dueDate: TODAY,
    firstReviewedAt: addDays(TODAY, -10),
    suspendedAt: null,
    ...partial,
  });
  return card;
}

describe("ReviewCard", () => {
  it("graduates and persists a new card on a passing grade", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Q", backText: "A" },
      ownerId,
    );

    const result = await new ReviewCard(authFor(ownerId, "owner@example.com"), cardRepository).execute({
      cardId: card.id,
      grade: "good",
    });

    expect(result.status).toBe("success");
    const persisted = await cardRepository.findById(card.id, ownerId);
    expect(persisted?.intervalDays).toBe(1);
    expect(persisted?.dueDate).toEqual(addDays(TODAY, 1));
    expect(persisted?.firstReviewedAt).toEqual(TODAY);
    expect(persisted?.reps).toBe(1);
  });

  it("persists the lapse penalty and dueDate = today on again", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const card = await makeReviewCard(deck.id, ownerId, { intervalDays: 25, lapses: 2 });

    await new ReviewCard(authFor(ownerId, "owner@example.com"), cardRepository).execute({
      cardId: card.id,
      grade: "again",
    });

    const persisted = await cardRepository.findById(card.id, ownerId);
    expect(persisted?.intervalDays).toBe(1);
    expect(persisted?.lapses).toBe(3);
    expect(persisted?.reps).toBe(0);
    expect(persisted?.ease).toBe(2300);
    expect(persisted?.dueDate).toEqual(TODAY);
  });

  it("rejects a foreign card and persists nothing", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Q", backText: "A" },
      ownerId,
    );

    const result = await new ReviewCard(authFor(intruderId, "intruder@example.com"), cardRepository).execute({
      cardId: card.id,
      grade: "good",
    });

    expect(result.status).toBe("not_found");
    const persisted = await cardRepository.findById(card.id, ownerId);
    expect(persisted?.intervalDays).toBe(0);
    expect(persisted?.dueDate).toBeNull();
    expect(persisted?.firstReviewedAt).toBeNull();
  });
});

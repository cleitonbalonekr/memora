import { describe, expect, it } from "vitest";
import { ListDecks } from "./list-decks";
import { DrizzleCardRepository } from "@/adapters/db/drizzle-card-repository";
import { DrizzleDeckRepository } from "@/adapters/db/drizzle-deck-repository";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { FakeAuthGateway } from "../../../../tests/support/fake-auth-gateway";
import { todayUtc } from "@/shared/today";

const deckRepository = new DrizzleDeckRepository();
const cardRepository = new DrizzleCardRepository();
const userRepository = new DrizzleUserRepository();

async function createUser(email: string): Promise<string> {
  const id = crypto.randomUUID();
  await userRepository.createProfile({ id, email });
  return id;
}

describe("listDecks", () => {
  it("returns only the current user's decks", async () => {
    const ownerId = await createUser("owner@example.com");
    const otherId = await createUser("other@example.com");

    await deckRepository.create({ userId: ownerId, title: "Spanish" });
    await deckRepository.create({ userId: ownerId, title: "Biology" });
    await deckRepository.create({ userId: otherId, title: "Not mine" });

    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const decks = await new ListDecks(
      auth,
      deckRepository,
      cardRepository,
    ).execute();

    expect(decks.map((deck) => deck.title)).toEqual(["Spanish", "Biology"]);
  });

  it("derives card stats: new cards count as due, scheduled cards as progress", async () => {
    const ownerId = await createUser("stats@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Math" });

    // Two new cards (never scheduled) — both count as due.
    await cardRepository.create(
      { deckId: deck.id, frontText: "1+1", backText: "2" },
      ownerId,
    );
    const second = await cardRepository.create(
      { deckId: deck.id, frontText: "2+2", backText: "4" },
      ownerId,
    );

    // Schedule the second card into the future so it is no longer due.
    const future = new Date(todayUtc().getTime() + 7 * 24 * 60 * 60 * 1000);
    await cardRepository.saveReviewState(second.id, ownerId, {
      intervalDays: 7,
      ease: 2500,
      reps: 1,
      lapses: 0,
      dueDate: future,
      firstReviewedAt: todayUtc(),
      suspendedAt: null,
    });

    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "stats@example.com" },
    });

    const [summary] = await new ListDecks(
      auth,
      deckRepository,
      cardRepository,
    ).execute();

    expect(summary.cardCount).toBe(2);
    expect(summary.dueCount).toBe(1);
    expect(summary.progress).toBe(50);
  });

  it("throws Unauthorized when there is no signed-in user", async () => {
    const auth = new FakeAuthGateway({ currentUser: null });

    await expect(
      new ListDecks(auth, deckRepository, cardRepository).execute(),
    ).rejects.toThrow("Unauthorized");
  });
});

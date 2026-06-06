import { describe, expect, it } from "vitest";
import { ListCards } from "./list-cards";
import { DrizzleCardRepository } from "@/adapters/db/drizzle-card-repository";
import { DrizzleDeckRepository } from "@/adapters/db/drizzle-deck-repository";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { FakeAuthGateway } from "../../../../tests/support/fake-auth-gateway";

const cardRepository = new DrizzleCardRepository();
const deckRepository = new DrizzleDeckRepository();
const userRepository = new DrizzleUserRepository();

async function createUser(email: string): Promise<string> {
  const id = crypto.randomUUID();
  await userRepository.createProfile({ id, email });
  return id;
}

describe("listCards", () => {
  it("returns the cards in the owner's deck in creation order", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    await cardRepository.create(
      { deckId: deck.id, frontText: "First?", backText: "1" },
      ownerId,
    );
    await cardRepository.create(
      { deckId: deck.id, frontText: "Second?", backText: "2" },
      ownerId,
    );
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const cards = await new ListCards(auth, cardRepository).execute(deck.id);

    expect(cards.map((card) => card.frontText)).toEqual(["First?", "Second?"]);
  });

  it("rejects listing cards in another user's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const auth = new FakeAuthGateway({
      currentUser: { id: intruderId, email: "intruder@example.com" },
    });

    await expect(
      new ListCards(auth, cardRepository).execute(deck.id),
    ).rejects.toThrow("not found or unauthorized");
  });
});

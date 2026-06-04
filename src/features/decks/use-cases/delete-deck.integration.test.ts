import { describe, expect, it } from "vitest";
import { deleteDeck } from "./delete-deck";
import { DrizzleDeckRepository } from "@/adapters/db/drizzle-deck-repository";
import { DrizzleCardRepository } from "@/adapters/db/drizzle-card-repository";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { FakeAuthGateway } from "../../../../tests/support/fake-auth-gateway";

const deckRepository = new DrizzleDeckRepository();
const cardRepository = new DrizzleCardRepository();
const userRepository = new DrizzleUserRepository();

async function createUser(email: string): Promise<string> {
  const id = crypto.randomUUID();
  await userRepository.createProfile({ id, email });
  return id;
}

describe("deleteDeck", () => {
  it("deletes the owner's deck and cascades to its cards", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Spanish" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Hola?", backText: "Hello" },
      ownerId,
    );
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await deleteDeck(deck.id, auth, deckRepository);

    expect(result.status).toBe("success");
    expect(await deckRepository.findById(deck.id, ownerId)).toBeNull();
    expect(await cardRepository.findById(card.id, ownerId)).toBeNull();
  });

  it("returns not_found when deleting another user's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const auth = new FakeAuthGateway({
      currentUser: { id: intruderId, email: "intruder@example.com" },
    });

    const result = await deleteDeck(deck.id, auth, deckRepository);

    expect(result.status).toBe("not_found");
    expect(await deckRepository.findById(deck.id, ownerId)).not.toBeNull();
  });
});

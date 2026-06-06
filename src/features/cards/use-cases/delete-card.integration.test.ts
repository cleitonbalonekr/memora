import { describe, expect, it } from "vitest";
import { DeleteCard } from "./delete-card";
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

describe("deleteCard", () => {
  it("deletes the owner's card", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Q?", backText: "A" },
      ownerId,
    );
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await new DeleteCard(auth, cardRepository).execute(card.id);

    expect(result.status).toBe("success");
    expect(await cardRepository.findById(card.id, ownerId)).toBeNull();
  });

  it("returns not_found when deleting another user's card", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Mine?", backText: "Yes" },
      ownerId,
    );
    const auth = new FakeAuthGateway({
      currentUser: { id: intruderId, email: "intruder@example.com" },
    });

    const result = await new DeleteCard(auth, cardRepository).execute(card.id);

    expect(result.status).toBe("not_found");
    expect(await cardRepository.findById(card.id, ownerId)).not.toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { GetCard } from "./get-card";
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

describe("getCard", () => {
  it("returns the card when it belongs to the current user", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "What is the femur?", backText: "A bone." },
      ownerId,
    );
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const found = await new GetCard(auth, cardRepository).execute(card.id);

    expect(found?.id).toBe(card.id);
    expect(found?.frontText).toBe("What is the femur?");
  });

  it("returns null for another user's card", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Secret?", backText: "Yes." },
      ownerId,
    );
    const auth = new FakeAuthGateway({
      currentUser: { id: intruderId, email: "intruder@example.com" },
    });

    expect(await new GetCard(auth, cardRepository).execute(card.id)).toBeNull();
  });
});

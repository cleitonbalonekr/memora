import { describe, expect, it } from "vitest";
import { createCard } from "./create-card";
import { CARD_SIDE_MAX } from "@/features/cards/domain/card-rules";
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

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe("createCard", () => {
  it("persists a card into the owner's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await createCard(
      deck.id,
      formData({ front: "What is the femur?", back: "A bone." }),
      auth,
      cardRepository,
    );

    expect(result.status).toBe("success");
    const cards = await cardRepository.listByDeckId(deck.id, ownerId);
    expect(cards).toHaveLength(1);
    expect(cards[0].frontText).toBe("What is the femur?");
  });

  it("returns not_found when adding to another user's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const auth = new FakeAuthGateway({
      currentUser: { id: intruderId, email: "intruder@example.com" },
    });

    const result = await createCard(
      deck.id,
      formData({ front: "Sneaky?", back: "No." }),
      auth,
      cardRepository,
    );

    expect(result.status).toBe("not_found");
    expect(await cardRepository.listByDeckId(deck.id, ownerId)).toHaveLength(0);
  });

  it("rejects a side over the length cap and persists nothing", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await createCard(
      deck.id,
      formData({ front: "a".repeat(CARD_SIDE_MAX + 1), back: "A bone." }),
      auth,
      cardRepository,
    );

    expect(result.status).toBe("invalid_input");
    if (result.status !== "invalid_input") return;
    expect(result.fieldErrors.front).toBeDefined();
    expect(await cardRepository.listByDeckId(deck.id, ownerId)).toHaveLength(0);
  });
});

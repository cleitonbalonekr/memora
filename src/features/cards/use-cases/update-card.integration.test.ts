import { describe, expect, it } from "vitest";
import { updateCard } from "./update-card";
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

describe("updateCard", () => {
  it("updates the owner's card front and back", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Old?", backText: "Old" },
      ownerId,
    );
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await updateCard(
      card.id,
      formData({ front: "New?", back: "New" }),
      auth,
      cardRepository,
    );

    expect(result.status).toBe("success");
    const reloaded = await cardRepository.findById(card.id, ownerId);
    expect(reloaded?.frontText).toBe("New?");
    expect(reloaded?.backText).toBe("New");
  });

  it("returns not_found when updating another user's card", async () => {
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

    const result = await updateCard(
      card.id,
      formData({ front: "Hijacked?", back: "No" }),
      auth,
      cardRepository,
    );

    expect(result.status).toBe("not_found");
    const reloaded = await cardRepository.findById(card.id, ownerId);
    expect(reloaded?.frontText).toBe("Mine?");
  });

  it("returns invalid_input when a side is empty", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Anatomy" });
    const card = await cardRepository.create(
      { deckId: deck.id, frontText: "Q?", backText: "A" },
      ownerId,
    );
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await updateCard(
      card.id,
      formData({ front: "Q?", back: "  " }),
      auth,
      cardRepository,
    );

    expect(result.status).toBe("invalid_input");
  });
});

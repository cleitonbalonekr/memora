import { describe, expect, it } from "vitest";
import { saveSelectedDrafts } from "./save-selected-drafts";
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

describe("saveSelectedDrafts", () => {
  it("persists selected drafts as cards in the owner's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Biology" });
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await saveSelectedDrafts(
      deck.id,
      [
        { frontText: "What is mitosis?", backText: "Cell division." },
        { frontText: "What is meiosis?", backText: "Gamete-forming division." },
      ],
      { authGateway: auth, cardRepository },
    );

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.savedCount).toBe(2);

    const cards = await cardRepository.listByDeckId(deck.id, ownerId);
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.frontText.length).toBeLessThanOrEqual(CARD_SIDE_MAX);
      expect(card.backText.length).toBeLessThanOrEqual(CARD_SIDE_MAX);
    }
  });

  it("rejects a draft over the length cap and persists nothing", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Biology" });
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await saveSelectedDrafts(
      deck.id,
      [
        { frontText: "What is mitosis?", backText: "Cell division." },
        { frontText: "a".repeat(CARD_SIDE_MAX + 1), backText: "Too long." },
      ],
      { authGateway: auth, cardRepository },
    );

    expect(result.status).toBe("invalid_input");
    expect(await cardRepository.listByDeckId(deck.id, ownerId)).toHaveLength(0);
  });

  it("returns not_found and persists nothing for another user's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const auth = new FakeAuthGateway({
      currentUser: { id: intruderId, email: "intruder@example.com" },
    });

    const result = await saveSelectedDrafts(
      deck.id,
      [{ frontText: "Sneaky?", backText: "No." }],
      { authGateway: auth, cardRepository },
    );

    expect(result.status).toBe("not_found");
    expect(await cardRepository.listByDeckId(deck.id, ownerId)).toHaveLength(0);
  });
});

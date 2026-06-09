import { describe, expect, it } from "vitest";
import { DrizzleCardRepository } from "./drizzle-card-repository";
import { DrizzleDeckRepository } from "./drizzle-deck-repository";
import { DrizzleUserRepository } from "./drizzle-user-repository";

const cardRepository = new DrizzleCardRepository();
const deckRepository = new DrizzleDeckRepository();
const userRepository = new DrizzleUserRepository();

async function createUser(email: string): Promise<string> {
  const id = crypto.randomUUID();
  await userRepository.createProfile({ id, email });
  return id;
}

describe("DrizzleCardRepository.createMany", () => {
  it("persists all cards for an owned deck and returns them", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Biology" });

    const created = await cardRepository.createMany(
      [
        { deckId: deck.id, frontText: "What is mitosis?", backText: "Cell division." },
        { deckId: deck.id, frontText: "What is meiosis?", backText: "Gamete-forming division." },
      ],
      ownerId,
    );

    expect(created).toHaveLength(2);
    const persisted = await cardRepository.listByDeckId(deck.id, ownerId);
    expect(persisted).toHaveLength(2);
    expect(persisted.map((c) => c.frontText)).toEqual(
      expect.arrayContaining(["What is mitosis?", "What is meiosis?"]),
    );
  });

  it("returns [] and persists nothing for empty input", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Empty" });

    const created = await cardRepository.createMany([], ownerId);

    expect(created).toEqual([]);
    expect(await cardRepository.listByDeckId(deck.id, ownerId)).toHaveLength(0);
  });

  it("throws and persists nothing for a non-owned deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });

    await expect(
      cardRepository.createMany(
        [{ deckId: deck.id, frontText: "Sneaky?", backText: "No." }],
        intruderId,
      ),
    ).rejects.toThrow("Deck not found or unauthorized");

    expect(await cardRepository.listByDeckId(deck.id, ownerId)).toHaveLength(0);
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { DrizzleDeckRepository } from "./drizzle-deck-repository";
import { DrizzleUserRepository } from "./drizzle-user-repository";

const deckRepository = new DrizzleDeckRepository();
const userRepository = new DrizzleUserRepository();

async function createUser(email: string): Promise<string> {
  const id = crypto.randomUUID();
  await userRepository.createProfile({ id, email });
  return id;
}

describe("DrizzleDeckRepository ownership enforcement", () => {
  let ownerId: string;
  let intruderId: string;
  let deckId: string;

  beforeEach(async () => {
    ownerId = await createUser("owner@example.com");
    intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private deck" });
    deckId = deck.id;
  });

  it("does not return another user's deck by id", async () => {
    expect(await deckRepository.findById(deckId, ownerId)).not.toBeNull();
    expect(await deckRepository.findById(deckId, intruderId)).toBeNull();
  });

  it("rejects updates to another user's deck", async () => {
    await expect(
      deckRepository.update(deckId, intruderId, { title: "Hijacked" }),
    ).rejects.toThrow("not found or unauthorized");

    const deck = await deckRepository.findById(deckId, ownerId);
    expect(deck?.title).toBe("Private deck");
  });

  it("rejects deletes of another user's deck", async () => {
    await expect(deckRepository.delete(deckId, intruderId)).rejects.toThrow(
      "not found or unauthorized",
    );

    expect(await deckRepository.findById(deckId, ownerId)).not.toBeNull();
  });
});

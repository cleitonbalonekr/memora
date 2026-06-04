import { describe, expect, it } from "vitest";
import { getDeck } from "./get-deck";
import { DrizzleDeckRepository } from "@/adapters/db/drizzle-deck-repository";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { FakeAuthGateway } from "../../../../tests/support/fake-auth-gateway";

const deckRepository = new DrizzleDeckRepository();
const userRepository = new DrizzleUserRepository();

async function createUser(email: string): Promise<string> {
  const id = crypto.randomUUID();
  await userRepository.createProfile({ id, email });
  return id;
}

describe("getDeck", () => {
  it("returns the deck when it belongs to the current user", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Spanish" });
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const found = await getDeck(deck.id, auth, deckRepository);

    expect(found?.id).toBe(deck.id);
    expect(found?.title).toBe("Spanish");
  });

  it("returns null for another user's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const auth = new FakeAuthGateway({
      currentUser: { id: intruderId, email: "intruder@example.com" },
    });

    expect(await getDeck(deck.id, auth, deckRepository)).toBeNull();
  });

  it("throws Unauthorized when there is no signed-in user", async () => {
    const auth = new FakeAuthGateway({ currentUser: null });

    await expect(
      getDeck(crypto.randomUUID(), auth, deckRepository),
    ).rejects.toThrow("Unauthorized");
  });
});

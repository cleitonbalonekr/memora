import { describe, expect, it } from "vitest";
import { ListDecks } from "./list-decks";
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

describe("listDecks", () => {
  it("returns only the current user's decks", async () => {
    const ownerId = await createUser("owner@example.com");
    const otherId = await createUser("other@example.com");

    await deckRepository.create({ userId: ownerId, title: "Spanish" });
    await deckRepository.create({ userId: ownerId, title: "Biology" });
    await deckRepository.create({ userId: otherId, title: "Not mine" });

    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const decks = await new ListDecks(auth, deckRepository).execute();

    expect(decks.map((deck) => deck.title)).toEqual(["Spanish", "Biology"]);
  });

  it("throws Unauthorized when there is no signed-in user", async () => {
    const auth = new FakeAuthGateway({ currentUser: null });

    await expect(new ListDecks(auth, deckRepository).execute()).rejects.toThrow(
      "Unauthorized",
    );
  });
});

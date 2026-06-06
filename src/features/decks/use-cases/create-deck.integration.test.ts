import { describe, expect, it } from "vitest";
import { CreateDeck } from "./create-deck";
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

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe("createDeck", () => {
  it("persists a deck owned by the current user", async () => {
    const ownerId = await createUser("owner@example.com");
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await new CreateDeck(auth, deckRepository).execute(
      formData({ title: "Spanish", description: "Verbs" }),
    );

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.deck.userId).toBe(ownerId);
    expect(result.deck.title).toBe("Spanish");
    expect(result.deck.description).toBe("Verbs");

    const decks = await deckRepository.listByUserId(ownerId);
    expect(decks).toHaveLength(1);
  });

  it("returns invalid_input when the title is missing", async () => {
    const ownerId = await createUser("owner@example.com");
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await new CreateDeck(auth, deckRepository).execute(
      formData({ title: "  " }),
    );

    expect(result.status).toBe("invalid_input");
    if (result.status !== "invalid_input") return;
    expect(result.fieldErrors.title).toBeDefined();

    expect(await deckRepository.listByUserId(ownerId)).toHaveLength(0);
  });

  it("throws Unauthorized when there is no signed-in user", async () => {
    const auth = new FakeAuthGateway({ currentUser: null });

    await expect(
      new CreateDeck(auth, deckRepository).execute(formData({ title: "Spanish" })),
    ).rejects.toThrow("Unauthorized");
  });
});

import { describe, expect, it } from "vitest";
import { updateDeck } from "./update-deck";
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

describe("updateDeck", () => {
  it("updates the owner's deck title and description", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({
      userId: ownerId,
      title: "Old",
      description: "Old description",
    });
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await updateDeck(
      deck.id,
      formData({ title: "New", description: "New description" }),
      auth,
      deckRepository,
    );

    expect(result.status).toBe("success");
    const reloaded = await deckRepository.findById(deck.id, ownerId);
    expect(reloaded?.title).toBe("New");
    expect(reloaded?.description).toBe("New description");
  });

  it("clears the description when the field is empty", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({
      userId: ownerId,
      title: "Spanish",
      description: "Has a description",
    });
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    await updateDeck(deck.id, formData({ title: "Spanish" }), auth, deckRepository);

    const reloaded = await deckRepository.findById(deck.id, ownerId);
    expect(reloaded?.description).toBeNull();
  });

  it("returns not_found when updating another user's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const auth = new FakeAuthGateway({
      currentUser: { id: intruderId, email: "intruder@example.com" },
    });

    const result = await updateDeck(
      deck.id,
      formData({ title: "Hijacked" }),
      auth,
      deckRepository,
    );

    expect(result.status).toBe("not_found");
    const reloaded = await deckRepository.findById(deck.id, ownerId);
    expect(reloaded?.title).toBe("Private");
  });

  it("returns invalid_input when the title is missing", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Spanish" });
    const auth = new FakeAuthGateway({
      currentUser: { id: ownerId, email: "owner@example.com" },
    });

    const result = await updateDeck(
      deck.id,
      formData({ title: "  " }),
      auth,
      deckRepository,
    );

    expect(result.status).toBe("invalid_input");
  });
});

import { describe, expect, it } from "vitest";
import { GenerateCardDrafts } from "./generate-card-drafts";
import { CARD_SIDE_MAX } from "@/features/cards/domain/card-rules";
import { DrizzleDeckRepository } from "@/adapters/db/drizzle-deck-repository";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { AuthGateway } from "@/ports/auth-gateway";
import { RateLimiter } from "@/ports/rate-limiter";
import { LlmClient } from "@/ports/llm-client";
import { FakeAuthGateway } from "../../../../tests/support/fake-auth-gateway";
import { FakeLlmClient } from "../../../../tests/support/fake-llm-client";
import { FakeRateLimiter } from "../../../../tests/support/fake-rate-limiter";

const deckRepository = new DrizzleDeckRepository();
const userRepository = new DrizzleUserRepository();

async function createUser(email: string): Promise<string> {
  const id = crypto.randomUUID();
  await userRepository.createProfile({ id, email });
  return id;
}

interface UseCaseDeps {
  authGateway: AuthGateway;
  rateLimiter: RateLimiter;
  llmClient: LlmClient;
}

function useCase(overrides: Partial<UseCaseDeps>): GenerateCardDrafts {
  const deps: UseCaseDeps = {
    authGateway: new FakeAuthGateway(),
    rateLimiter: new FakeRateLimiter({ allowed: true }),
    llmClient: new FakeLlmClient(),
    ...overrides,
  };
  return new GenerateCardDrafts(
    deps.authGateway,
    deckRepository,
    deps.rateLimiter,
    deps.llmClient,
  );
}

describe("generateCardDrafts", () => {
  it("returns validated drafts for the owner's deck", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Biology" });
    const client = new FakeLlmClient({
      drafts: [
        { frontText: "  What is mitosis?  ", backText: "  Cell division.  " },
        { frontText: "a".repeat(CARD_SIDE_MAX + 1), backText: "too long" },
      ],
    });

    const result = await useCase({
      authGateway: new FakeAuthGateway({
        currentUser: { id: ownerId, email: "owner@example.com" },
      }),
      llmClient: client,
    }).execute({ deckId: deck.id, topicOrNotes: "Cell biology" });

    expect(result.status).toBe("success");
    if (result.status !== "success") return;
    expect(result.drafts).toEqual([
      { frontText: "What is mitosis?", backText: "Cell division." },
    ]);
    expect(client.calls).toHaveLength(1);
  });

  it("rejects empty input without calling the provider", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Biology" });
    const client = new FakeLlmClient({
      drafts: [{ frontText: "Q?", backText: "A." }],
    });

    const result = await useCase({
      authGateway: new FakeAuthGateway({
        currentUser: { id: ownerId, email: "owner@example.com" },
      }),
      llmClient: client,
    }).execute({ deckId: deck.id, topicOrNotes: "   " });

    expect(result.status).toBe("invalid_input");
    expect(client.calls).toHaveLength(0);
  });

  it("returns not_found for a deck the user does not own", async () => {
    const ownerId = await createUser("owner@example.com");
    const intruderId = await createUser("intruder@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Private" });
    const client = new FakeLlmClient({
      drafts: [{ frontText: "Q?", backText: "A." }],
    });

    const result = await useCase({
      authGateway: new FakeAuthGateway({
        currentUser: { id: intruderId, email: "intruder@example.com" },
      }),
      llmClient: client,
    }).execute({ deckId: deck.id, topicOrNotes: "Sneak a peek" });

    expect(result.status).toBe("not_found");
    expect(client.calls).toHaveLength(0);
  });

  it("returns rate_limited without calling the provider when over the limit", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Biology" });
    const client = new FakeLlmClient({
      drafts: [{ frontText: "Q?", backText: "A." }],
    });

    const result = await useCase({
      authGateway: new FakeAuthGateway({
        currentUser: { id: ownerId, email: "owner@example.com" },
      }),
      rateLimiter: new FakeRateLimiter({ allowed: false, retryAfterSeconds: 30 }),
      llmClient: client,
    }).execute({ deckId: deck.id, topicOrNotes: "Cell biology" });

    expect(result.status).toBe("rate_limited");
    if (result.status !== "rate_limited") return;
    expect(result.retryAfterSeconds).toBe(30);
    expect(client.calls).toHaveLength(0);
  });

  it("maps a malformed-output failure to provider_error", async () => {
    const ownerId = await createUser("owner@example.com");
    const deck = await deckRepository.create({ userId: ownerId, title: "Biology" });

    const result = await useCase({
      authGateway: new FakeAuthGateway({
        currentUser: { id: ownerId, email: "owner@example.com" },
      }),
      llmClient: new FakeLlmClient({ error: "malformed" }),
    }).execute({ deckId: deck.id, topicOrNotes: "Cell biology" });

    expect(result.status).toBe("provider_error");
  });
});

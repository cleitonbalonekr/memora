import { SupabaseAuthGateway } from "@/adapters/auth/supabase-auth-gateway";
import { DrizzleCardRepository } from "@/adapters/db/drizzle-card-repository";
import { DrizzleDeckRepository } from "@/adapters/db/drizzle-deck-repository";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { InMemoryRateLimiter } from "@/adapters/ai/in-memory-rate-limiter";
import { OpenRouterCardGenerator } from "@/adapters/ai/openrouter-card-generator";
import { AiCardGenerator } from "@/ports/ai-card-generator";
import { AuthGateway } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { DeckRepository } from "@/ports/deck-repository";
import { RateLimiter } from "@/ports/rate-limiter";
import { UserRepository } from "@/ports/user-repository";

// Composition root: the single place where ports are bound to concrete
// adapters. The web layer (pages, server actions) resolves dependencies here
// and passes them into use cases, so use cases stay decoupled from adapters
// (ADR-003, ADR-005) and tests keep substituting fakes through the same seam.

// Repositories are stateless and lean on the process-wide Drizzle client, so a
// single shared instance is reused across requests.
const deckRepository = new DrizzleDeckRepository();
const cardRepository = new DrizzleCardRepository();
const userRepository = new DrizzleUserRepository();

export function getDeckRepository(): DeckRepository {
  return deckRepository;
}

export function getCardRepository(): CardRepository {
  return cardRepository;
}

export function getUserRepository(): UserRepository {
  return userRepository;
}

// Request-scoped: the auth gateway reads per-request cookies, so a fresh
// instance is created on each resolution.
export function getAuthGateway(): AuthGateway {
  return new SupabaseAuthGateway();
}

// Shared singleton: the in-memory rate limiter holds per-user counters in
// process memory, so it must be the same instance across requests to enforce
// the window (design D7).
const rateLimiter = new InMemoryRateLimiter();

export function getRateLimiter(): RateLimiter {
  return rateLimiter;
}

// Constructed lazily so OPENROUTER_API_KEY is only required where AI generation
// is actually used (the config asserts the key at construction).
export function getAiCardGenerator(): AiCardGenerator {
  return new OpenRouterCardGenerator();
}

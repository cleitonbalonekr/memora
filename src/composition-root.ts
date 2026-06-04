import { SupabaseAuthGateway } from "@/adapters/auth/supabase-auth-gateway";
import { DrizzleCardRepository } from "@/adapters/db/drizzle-card-repository";
import { DrizzleDeckRepository } from "@/adapters/db/drizzle-deck-repository";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { AuthGateway } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { DeckRepository } from "@/ports/deck-repository";
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

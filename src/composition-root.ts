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
import { CreateDeck } from "@/features/decks/use-cases/create-deck";
import { UpdateDeck } from "@/features/decks/use-cases/update-deck";
import { DeleteDeck } from "@/features/decks/use-cases/delete-deck";
import { ListDecks } from "@/features/decks/use-cases/list-decks";
import { GetDeck } from "@/features/decks/use-cases/get-deck";
import { CreateCard } from "@/features/cards/use-cases/create-card";
import { UpdateCard } from "@/features/cards/use-cases/update-card";
import { DeleteCard } from "@/features/cards/use-cases/delete-card";
import { ListCards } from "@/features/cards/use-cases/list-cards";
import { GetCard } from "@/features/cards/use-cases/get-card";
import { StartStudySession } from "@/features/study/use-cases/start-study-session";
import { GenerateCardDrafts } from "@/features/ai/use-cases/generate-card-drafts";
import { SaveSelectedDrafts } from "@/features/ai/use-cases/save-selected-drafts";
import { RegisterUser } from "@/features/auth/use-cases/register-user";
import { LoginUser } from "@/features/auth/use-cases/login-user";
import { LogoutUser } from "@/features/auth/use-cases/logout-user";

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

// Use-case factories: each returns a fresh instance per call so the
// request-scoped auth gateway is never captured by a module-level singleton (a
// cached instance would bind a stale gateway and leak data across users).

export function getCreateDeck(): CreateDeck {
  return new CreateDeck(getAuthGateway(), getDeckRepository());
}

export function getUpdateDeck(): UpdateDeck {
  return new UpdateDeck(getAuthGateway(), getDeckRepository());
}

export function getDeleteDeck(): DeleteDeck {
  return new DeleteDeck(getAuthGateway(), getDeckRepository());
}

export function getListDecks(): ListDecks {
  return new ListDecks(getAuthGateway(), getDeckRepository());
}

export function getDeck(): GetDeck {
  return new GetDeck(getAuthGateway(), getDeckRepository());
}

export function getCreateCard(): CreateCard {
  return new CreateCard(getAuthGateway(), getCardRepository());
}

export function getUpdateCard(): UpdateCard {
  return new UpdateCard(getAuthGateway(), getCardRepository());
}

export function getDeleteCard(): DeleteCard {
  return new DeleteCard(getAuthGateway(), getCardRepository());
}

export function getListCards(): ListCards {
  return new ListCards(getAuthGateway(), getCardRepository());
}

export function getCard(): GetCard {
  return new GetCard(getAuthGateway(), getCardRepository());
}

export function getStartStudySession(): StartStudySession {
  return new StartStudySession(getAuthGateway(), getCardRepository());
}

export function getGenerateCardDrafts(): GenerateCardDrafts {
  return new GenerateCardDrafts(
    getAuthGateway(),
    getDeckRepository(),
    getRateLimiter(),
    getAiCardGenerator(),
  );
}

export function getSaveSelectedDrafts(): SaveSelectedDrafts {
  return new SaveSelectedDrafts(getAuthGateway(), getCardRepository());
}

export function getRegisterUser(): RegisterUser {
  return new RegisterUser(getAuthGateway(), getUserRepository());
}

export function getLoginUser(): LoginUser {
  return new LoginUser(getAuthGateway(), getUserRepository());
}

export function getLogoutUser(): LogoutUser {
  return new LogoutUser(getAuthGateway());
}

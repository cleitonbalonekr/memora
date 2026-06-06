import { AiCardGenerator } from "@/ports/ai-card-generator";
import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { DeckRepository } from "@/ports/deck-repository";
import { RateLimiter } from "@/ports/rate-limiter";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { validateDrafts } from "@/features/ai/domain/draft-validator";
import { GenerateDraftsResult, mapGenerateError } from "./draft-errors";

// Upper bound on input size: enough for pasted notes, bounded to keep prompt
// cost in check (the model output count is capped separately by MAX_DRAFTS).
export const TOPIC_OR_NOTES_MAX = 5000;
// Per-request draft cap (design open question: ~10) — also enforced by the
// validator so the provider can never blow past it.
export const MAX_DRAFTS = 10;

export interface GenerateCardDraftsInput {
  deckId: string;
  topicOrNotes: string;
}

export class GenerateCardDrafts extends AuthedUseCase<
  GenerateCardDraftsInput,
  GenerateDraftsResult
> {
  constructor(
    auth: AuthGateway,
    private readonly decks: DeckRepository,
    private readonly rateLimiter: RateLimiter,
    private readonly aiCardGenerator: AiCardGenerator,
  ) {
    super(auth);
  }

  protected async handle(
    user: SessionUser,
    { deckId, topicOrNotes }: GenerateCardDraftsInput,
  ): Promise<GenerateDraftsResult> {
    const trimmed = topicOrNotes.trim();
    if (trimmed.length === 0) {
      return { status: "invalid_input", message: "Enter a topic or paste some notes." };
    }
    if (trimmed.length > TOPIC_OR_NOTES_MAX) {
      return {
        status: "invalid_input",
        message: `Use at most ${TOPIC_OR_NOTES_MAX} characters.`,
      };
    }

    // Ownership check before any cost is incurred: a deck the user does not own
    // reads as not_found and never reaches the rate limiter or provider.
    const deck = await this.decks.findById(deckId, user.id);
    if (!deck) {
      return { status: "not_found" };
    }

    const rateCheck = this.rateLimiter.check(user.id);
    if (!rateCheck.allowed) {
      return {
        status: "rate_limited",
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        message: retryMessage(rateCheck.retryAfterSeconds),
      };
    }

    const rawDrafts = await this.aiCardGenerator.generateDrafts({
      topicOrNotes: trimmed,
      maxDrafts: MAX_DRAFTS,
    });
    return { status: "success", drafts: validateDrafts(rawDrafts, MAX_DRAFTS) };
  }

  protected mapError(error: unknown): GenerateDraftsResult {
    return mapGenerateError(error);
  }
}

function retryMessage(retryAfterSeconds?: number): string {
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    return `Too many requests. Try again in ${retryAfterSeconds} seconds.`;
  }
  return "Too many requests. Try again shortly.";
}

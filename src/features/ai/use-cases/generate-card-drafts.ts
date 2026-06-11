import { LlmClient } from "@/ports/llm-client";
import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { DeckRepository } from "@/ports/deck-repository";
import { RateLimiter } from "@/ports/rate-limiter";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { draftsResponseSchema } from "@/features/ai/domain/draft-schema";
import { validateDrafts } from "@/features/ai/domain/draft-validator";
import { buildGenerationPrompt } from "@/features/ai/domain/prompt-builder";
import { GenerateDraftsResult, mapGenerateError } from "./draft-errors";

export const TOPIC_OR_NOTES_MAX = 5000;
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
    private readonly llmClient: LlmClient,
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

    const prompt = buildGenerationPrompt({ topicOrNotes: trimmed, maxDrafts: MAX_DRAFTS });
    const result = await this.llmClient.generateStructured({
      system: prompt.system,
      user: prompt.user,
      schema: draftsResponseSchema,
      temperature: 0.7,
    });

    if (!result.ok) {
      return {
        status: "provider_error",
        message: "We could not generate cards right now. Try again.",
      };
    }

    return { status: "success", drafts: validateDrafts(result.data.drafts, MAX_DRAFTS) };
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

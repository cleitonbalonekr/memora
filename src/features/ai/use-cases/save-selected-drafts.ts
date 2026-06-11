import { CardDraft } from "@/features/ai/domain/draft-schema";
import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { validateCard } from "@/features/cards/domain/card-rules";
import { SaveDraftsResult, mapSaveError } from "./draft-errors";

export interface SaveSelectedDraftsInput {
  deckId: string;
  drafts: CardDraft[];
}

export class SaveSelectedDrafts extends AuthedUseCase<
  SaveSelectedDraftsInput,
  SaveDraftsResult
> {
  constructor(
    auth: AuthGateway,
    private readonly cards: CardRepository,
  ) {
    super(auth);
  }

  protected async handle(
    user: SessionUser,
    { deckId, drafts }: SaveSelectedDraftsInput,
  ): Promise<SaveDraftsResult> {
    if (drafts.length === 0) {
      return { status: "invalid_input", message: "Select at least one card to save." };
    }

    // Validate every draft against the shared card rules before persisting any, so
    // an invalid edit never results in a partial save.
    const normalized: CardDraft[] = [];
    for (const draft of drafts) {
      const frontText = draft.frontText.trim();
      const backText = draft.backText.trim();
      const { errors } = validateCard({ front: frontText, back: backText });
      if (Object.keys(errors).length > 0) {
        return {
          status: "invalid_input",
          message: "Some cards do not meet the card rules. Fix them and try again.",
        };
      }
      normalized.push({ frontText, backText });
    }

    const saved = await this.cards.createMany(
      normalized.map((d) => ({ deckId, frontText: d.frontText, backText: d.backText })),
      user.id,
    );

    return { status: "success", savedCount: saved.length };
  }

  protected mapError(error: unknown): SaveDraftsResult {
    return mapSaveError(error);
  }
}

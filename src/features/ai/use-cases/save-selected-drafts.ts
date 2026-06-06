import { CardDraft } from "@/ports/ai-card-generator";
import { AuthGateway } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";
import { validateCard } from "@/features/cards/domain/card-rules";
import { SaveDraftsResult, mapSaveError } from "./draft-errors";

export interface SaveSelectedDraftsDeps {
  authGateway: AuthGateway;
  cardRepository: CardRepository;
}

export async function saveSelectedDrafts(
  deckId: string,
  drafts: CardDraft[],
  deps: SaveSelectedDraftsDeps,
): Promise<SaveDraftsResult> {
  const user = await requireCurrentUser(deps.authGateway);

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

  try {
    // Ownership is enforced per insert by the repository; a non-owned deck throws
    // on the first create, so nothing is persisted.
    for (const draft of normalized) {
      await deps.cardRepository.create(
        { deckId, frontText: draft.frontText, backText: draft.backText },
        user.id,
      );
    }

    return { status: "success", savedCount: normalized.length };
  } catch (error) {
    return mapSaveError(error);
  }
}

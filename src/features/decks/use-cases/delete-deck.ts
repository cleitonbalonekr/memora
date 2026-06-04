import { AuthGateway } from "@/ports/auth-gateway";
import { DeckRepository } from "@/ports/deck-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";
import { DeckDeletionResult, isDeckNotFoundError } from "./deck-errors";

export async function deleteDeck(
  deckId: string,
  authGateway: AuthGateway,
  deckRepository: DeckRepository,
): Promise<DeckDeletionResult> {
  const user = await requireCurrentUser(authGateway);

  try {
    // The schema cascades the delete to the deck's cards (cards.deck_id FK).
    await deckRepository.delete(deckId, user.id);
    return { status: "success" };
  } catch (error) {
    if (isDeckNotFoundError(error)) {
      return { status: "not_found" };
    }

    return {
      status: "provider_error",
      message: "We could not complete this request. Try again.",
    };
  }
}

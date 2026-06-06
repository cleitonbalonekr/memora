import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { DeckRepository } from "@/ports/deck-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { DeckDeletionResult, isDeckNotFoundError } from "./deck-errors";

export class DeleteDeck extends AuthedUseCase<string, DeckDeletionResult> {
  constructor(
    auth: AuthGateway,
    private readonly decks: DeckRepository,
  ) {
    super(auth);
  }

  protected async handle(
    user: SessionUser,
    deckId: string,
  ): Promise<DeckDeletionResult> {
    // The schema cascades the delete to the deck's cards (cards.deck_id FK).
    await this.decks.delete(deckId, user.id);
    return { status: "success" };
  }

  protected mapError(error: unknown): DeckDeletionResult {
    if (isDeckNotFoundError(error)) {
      return { status: "not_found" };
    }

    return {
      status: "provider_error",
      message: "We could not complete this request. Try again.",
    };
  }
}

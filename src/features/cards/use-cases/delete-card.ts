import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { CardDeletionResult, isCardNotFoundError } from "./card-errors";

export class DeleteCard extends AuthedUseCase<string, CardDeletionResult> {
  constructor(
    auth: AuthGateway,
    private readonly cards: CardRepository,
  ) {
    super(auth);
  }

  protected async handle(
    user: SessionUser,
    cardId: string,
  ): Promise<CardDeletionResult> {
    await this.cards.delete(cardId, user.id);
    return { status: "success" };
  }

  protected mapError(error: unknown): CardDeletionResult {
    if (isCardNotFoundError(error)) {
      return { status: "not_found" };
    }

    return {
      status: "provider_error",
      message: "We could not complete this request. Try again.",
    };
  }
}

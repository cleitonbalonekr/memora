import { AuthGateway } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";
import { CardDeletionResult, isCardNotFoundError } from "./card-errors";

export async function deleteCard(
  cardId: string,
  authGateway: AuthGateway,
  cardRepository: CardRepository,
): Promise<CardDeletionResult> {
  const user = await requireCurrentUser(authGateway);

  try {
    await cardRepository.delete(cardId, user.id);
    return { status: "success" };
  } catch (error) {
    if (isCardNotFoundError(error)) {
      return { status: "not_found" };
    }

    return {
      status: "provider_error",
      message: "We could not complete this request. Try again.",
    };
  }
}

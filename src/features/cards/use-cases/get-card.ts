import { AuthGateway } from "@/ports/auth-gateway";
import { Card, CardRepository } from "@/ports/card-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";

// Returns null when the card does not exist or belongs to another user, so the
// web layer can render a 404 without revealing another user's data.
export async function getCard(
  cardId: string,
  authGateway: AuthGateway,
  cardRepository: CardRepository,
): Promise<Card | null> {
  const user = await requireCurrentUser(authGateway);
  return cardRepository.findById(cardId, user.id);
}

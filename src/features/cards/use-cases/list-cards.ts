import { AuthGateway } from "@/ports/auth-gateway";
import { Card, CardRepository } from "@/ports/card-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";

export async function listCards(
  deckId: string,
  authGateway: AuthGateway,
  cardRepository: CardRepository,
): Promise<Card[]> {
  const user = await requireCurrentUser(authGateway);
  return cardRepository.listByDeckId(deckId, user.id);
}

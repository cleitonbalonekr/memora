import { AuthGateway } from "@/ports/auth-gateway";
import { Deck, DeckRepository } from "@/ports/deck-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";

export async function listDecks(
  authGateway: AuthGateway,
  deckRepository: DeckRepository
): Promise<Deck[]> {
  const user = await requireCurrentUser(authGateway);
  return deckRepository.listByUserId(user.id);
}

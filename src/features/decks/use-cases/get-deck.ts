import { AuthGateway } from "@/ports/auth-gateway";
import { Deck, DeckRepository } from "@/ports/deck-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";

// Returns null when the deck does not exist or belongs to another user, so the
// web layer can render a 404 without revealing whether a deck exists for a
// different owner (SOC2 least privilege).
export async function getDeck(
  deckId: string,
  authGateway: AuthGateway,
  deckRepository: DeckRepository,
): Promise<Deck | null> {
  const user = await requireCurrentUser(authGateway);
  return deckRepository.findById(deckId, user.id);
}

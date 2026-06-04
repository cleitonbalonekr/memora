import { AuthGateway } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";
import { StudyCard } from "@/features/study/domain/study-session";

// Loads the owner's cards for a deck to seed a study session. Ownership is
// enforced by the repository (the deck join), so a non-owner deck is rejected.
export async function startStudySession(
  deckId: string,
  authGateway: AuthGateway,
  cardRepository: CardRepository,
): Promise<StudyCard[]> {
  const user = await requireCurrentUser(authGateway);
  const cards = await cardRepository.listByDeckId(deckId, user.id);

  return cards.map((card) => ({
    id: card.id,
    frontText: card.frontText,
    backText: card.backText,
  }));
}

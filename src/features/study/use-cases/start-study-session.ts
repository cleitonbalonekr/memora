import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { StudyCard } from "@/features/study/domain/study-session";

// Loads the owner's cards for a deck to seed a study session. Ownership is
// enforced by the repository (the deck join), so a non-owner deck is rejected.
export class StartStudySession extends AuthedUseCase<string, StudyCard[]> {
  constructor(
    auth: AuthGateway,
    private readonly cards: CardRepository,
  ) {
    super(auth);
  }

  protected async handle(user: SessionUser, deckId: string): Promise<StudyCard[]> {
    const cards = await this.cards.listByDeckId(deckId, user.id);

    return cards.map((card) => ({
      id: card.id,
      frontText: card.frontText,
      backText: card.backText,
    }));
  }
}

import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { Card, CardRepository } from "@/ports/card-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";

// Returns null when the card does not exist or belongs to another user, so the
// web layer can render a 404 without revealing another user's data.
export class GetCard extends AuthedUseCase<string, Card | null> {
  constructor(
    auth: AuthGateway,
    private readonly cards: CardRepository,
  ) {
    super(auth);
  }

  protected async handle(user: SessionUser, cardId: string): Promise<Card | null> {
    return this.cards.findById(cardId, user.id);
  }
}

import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { Card, CardRepository } from "@/ports/card-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";

export class ListCards extends AuthedUseCase<string, Card[]> {
  constructor(
    auth: AuthGateway,
    private readonly cards: CardRepository,
  ) {
    super(auth);
  }

  protected async handle(user: SessionUser, deckId: string): Promise<Card[]> {
    return this.cards.listByDeckId(deckId, user.id);
  }
}

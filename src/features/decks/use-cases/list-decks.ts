import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { Deck, DeckRepository } from "@/ports/deck-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";

export class ListDecks extends AuthedUseCase<void, Deck[]> {
  constructor(
    auth: AuthGateway,
    private readonly decks: DeckRepository,
  ) {
    super(auth);
  }

  protected async handle(user: SessionUser): Promise<Deck[]> {
    return this.decks.listByUserId(user.id);
  }
}

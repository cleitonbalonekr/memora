import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { Deck, DeckRepository } from "@/ports/deck-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";

// Returns null when the deck does not exist or belongs to another user, so the
// web layer can render a 404 without revealing whether a deck exists for a
// different owner (SOC2 least privilege).
export class GetDeck extends AuthedUseCase<string, Deck | null> {
  constructor(
    auth: AuthGateway,
    private readonly decks: DeckRepository,
  ) {
    super(auth);
  }

  protected async handle(user: SessionUser, deckId: string): Promise<Deck | null> {
    return this.decks.findById(deckId, user.id);
  }
}

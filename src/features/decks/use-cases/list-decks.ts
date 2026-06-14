import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { Deck, DeckRepository } from "@/ports/deck-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { todayUtc } from "@/shared/today";

// A deck plus its real card stats for list/dashboard rendering. `progress` is
// the share of cards scheduled ahead (not currently due), derived from SRS
// state — real data, not a placeholder.
export interface DeckSummary extends Deck {
  cardCount: number;
  dueCount: number;
  progress: number;
}

export class ListDecks extends AuthedUseCase<void, DeckSummary[]> {
  constructor(
    auth: AuthGateway,
    private readonly decks: DeckRepository,
    private readonly cards: CardRepository,
  ) {
    super(auth);
  }

  protected async handle(user: SessionUser): Promise<DeckSummary[]> {
    const [decks, stats] = await Promise.all([
      this.decks.listByUserId(user.id),
      this.cards.statsByUserId(user.id, todayUtc()),
    ]);

    const statsByDeck = new Map(stats.map((stat) => [stat.deckId, stat]));

    return decks.map((deck) => {
      const { total = 0, due = 0 } = statsByDeck.get(deck.id) ?? {};
      const progress =
        total === 0 ? 0 : Math.round(((total - due) / total) * 100);
      return { ...deck, cardCount: total, dueCount: due, progress };
    });
  }
}

import { Deck } from "@/ports/deck-repository";
import { DeckCard } from "./deck-card";

export function DeckList({ decks }: { decks: Deck[] }) {
  return (
    <ul className="flex flex-col gap-sm">
      {decks.map((deck) => (
        <li key={deck.id}>
          <DeckCard deck={deck} />
        </li>
      ))}
    </ul>
  );
}

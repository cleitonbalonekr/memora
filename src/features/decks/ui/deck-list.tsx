import { DeckSummary } from "@/features/decks/use-cases/list-decks";
import { DeckCard } from "./deck-card";

export function DeckList({ decks }: { decks: DeckSummary[] }) {
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

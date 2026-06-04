import Link from "next/link";
import { Deck } from "@/ports/deck-repository";

export function DeckCard({ deck }: { deck: Deck }) {
  return (
    <Link
      className="flex items-center justify-between gap-md rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-md shadow-level1 transition hover:shadow-md active:scale-[0.98]"
      href={`/decks/${deck.id}`}
    >
      <div className="flex flex-col gap-xs">
        <h2 className="text-headline-sm">{deck.title}</h2>
        {deck.description ? (
          <p className="text-body-md text-on-surface-variant">{deck.description}</p>
        ) : null}
      </div>
      <span aria-hidden className="text-headline-sm text-on-surface-variant">
        →
      </span>
    </Link>
  );
}

import Link from "next/link";
import { Card } from "@/ports/card-repository";

export function CardItem({ card }: { card: Card }) {
  return (
    <article className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-level1">
      <div className="flex items-start justify-between gap-md">
        <div className="flex-1">
          <span className="mb-1 block text-label-sm text-outline">Front</span>
          <p className="text-body-md font-medium text-on-surface">
            {card.frontText}
          </p>
        </div>
        <Link
          className="text-label-md text-primary hover:underline"
          href={`/decks/${card.deckId}/cards/${card.id}/edit`}
        >
          Edit
        </Link>
      </div>
      <div className="h-px w-full bg-surface-variant" />
      <div>
        <span className="mb-1 block text-label-sm text-outline">Back</span>
        <p className="text-body-md text-on-surface-variant">{card.backText}</p>
      </div>
    </article>
  );
}

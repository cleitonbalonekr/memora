import Link from "next/link";
import { CheckCircle2, Clock, Layers } from "lucide-react";
import { DeckSummary } from "@/features/decks/use-cases/list-decks";

export function DeckCard({ deck }: { deck: DeckSummary }) {
  const upToDate = deck.dueCount === 0;

  return (
    <Link
      className="relative flex flex-col gap-sm overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-md shadow-level1 transition hover:shadow-md active:scale-[0.98]"
      href={`/decks/${deck.id}`}
    >
      <div className="absolute left-0 top-0 h-1 w-full bg-surface-variant">
        <div
          className={`h-full ${upToDate ? "bg-secondary" : "bg-primary"}`}
          style={{ width: `${deck.progress}%` }}
        />
      </div>

      <div className="mt-xs flex items-start justify-between gap-md">
        <h2 className="text-headline-sm">{deck.title}</h2>
        <Layers aria-hidden className="h-5 w-5 shrink-0 text-on-surface-variant" />
      </div>

      {deck.description ? (
        <p className="text-body-md text-on-surface-variant">{deck.description}</p>
      ) : null}

      <p
        className={`flex items-center gap-xs text-body-md ${
          upToDate ? "text-secondary" : "text-error"
        }`}
      >
        {upToDate ? (
          <CheckCircle2 aria-hidden className="h-4 w-4" />
        ) : (
          <Clock aria-hidden className="h-4 w-4" />
        )}
        {upToDate
          ? "Up to date"
          : `${deck.dueCount} ${deck.dueCount === 1 ? "card" : "cards"} due`}
      </p>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-label-sm text-on-surface-variant">
          {deck.progress}% progress
        </span>
        <span
          className={`rounded px-sm py-xs text-label-sm ${
            upToDate
              ? "bg-surface-variant text-on-surface-variant"
              : "bg-primary/10 text-primary"
          }`}
        >
          {upToDate ? "Done" : "Review"}
        </span>
      </div>
    </Link>
  );
}

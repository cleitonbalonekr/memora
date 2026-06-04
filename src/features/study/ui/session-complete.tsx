import Link from "next/link";

interface SessionCompleteProps {
  clearedCount: number;
  deckId: string;
  onRestart: () => void;
}

export function SessionComplete({
  clearedCount,
  deckId,
  onRestart,
}: SessionCompleteProps) {
  return (
    <div className="flex min-h-[320px] w-full flex-col items-center justify-center gap-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg text-center shadow-level1">
      <h2 className="text-headline-md text-on-surface">Session complete</h2>
      <p className="text-body-md text-on-surface-variant">
        You cleared {clearedCount} {clearedCount === 1 ? "card" : "cards"}.
      </p>
      <div className="mt-sm flex w-full flex-col gap-sm">
        <button
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-md text-label-md text-on-primary shadow-level1 transition hover:bg-surface-tint"
          onClick={onRestart}
          type="button"
        >
          Study again
        </button>
        <Link
          className="flex h-12 w-full items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest px-md text-label-md text-primary transition hover:bg-surface-container-low"
          href={`/decks/${deckId}`}
        >
          Back to deck
        </Link>
      </div>
    </div>
  );
}

import { StudyCard as StudyCardModel } from "@/features/study/domain/study-session";

interface StudyCardProps {
  card: StudyCardModel;
  revealed: boolean;
  onReveal: () => void;
}

export function StudyCard({ card, revealed, onReveal }: StudyCardProps) {
  return (
    <div className="flex min-h-[320px] w-full flex-col gap-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg shadow-level1">
      <div className="flex flex-col gap-xs">
        <span className="text-label-sm uppercase tracking-wider text-primary">
          Front
        </span>
        <p className="text-headline-md text-on-surface">{card.frontText}</p>
      </div>

      {revealed ? (
        <div
          aria-live="polite"
          className="flex flex-col gap-xs border-t border-surface-variant pt-md"
        >
          <span className="text-label-sm uppercase tracking-wider text-secondary">
            Back
          </span>
          <p className="text-body-lg text-on-surface-variant">{card.backText}</p>
        </div>
      ) : (
        <button
          className="mt-auto flex h-12 w-full items-center justify-center rounded-xl border border-outline-variant bg-surface px-md text-label-md text-primary transition hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
          onClick={onReveal}
          type="button"
        >
          Reveal answer
        </button>
      )}
    </div>
  );
}

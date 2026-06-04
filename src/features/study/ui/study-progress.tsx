interface StudyProgressProps {
  completed: number;
  total: number;
}

export function StudyProgress({ completed, total }: StudyProgressProps) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="flex flex-col gap-xs">
      <div
        aria-label={`Progress: ${completed} of ${total} cards`}
        aria-valuemax={total}
        aria-valuemin={0}
        aria-valuenow={completed}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-variant"
        role="progressbar"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-center text-label-sm text-on-surface-variant">
        {completed} / {total} Cards
      </p>
    </div>
  );
}

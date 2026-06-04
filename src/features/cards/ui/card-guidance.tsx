interface CardGuidanceProps {
  hints: string[];
}

export function CardGuidance({ hints }: CardGuidanceProps) {
  if (hints.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Card writing tips"
      className="flex flex-col gap-xs rounded-lg bg-surface-container-low p-sm"
    >
      {hints.map((hint) => (
        <li className="text-label-md text-on-surface-variant" key={hint}>
          {hint}
        </li>
      ))}
    </ul>
  );
}

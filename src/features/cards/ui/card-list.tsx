import { Card } from "@/ports/card-repository";
import { CardItem } from "./card-item";

export function CardList({ cards }: { cards: Card[] }) {
  if (cards.length === 0) {
    return (
      <div className="flex min-h-[140px] flex-col justify-center gap-sm text-center">
        <h2 className="text-headline-sm">No cards yet</h2>
        <p className="text-body-md text-on-surface-variant">
          Add your first card to start studying.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {cards.map((card) => (
        <CardItem card={card} key={card.id} />
      ))}
    </div>
  );
}

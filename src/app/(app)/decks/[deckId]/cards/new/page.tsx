import Link from "next/link";
import { notFound } from "next/navigation";
import { createCardAction } from "@/app/(app)/decks/[deckId]/cards/actions";
import { getDeck } from "@/composition-root";
import { CardForm } from "@/features/cards/ui/card-form";

interface NewCardPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function NewCardPage({ params }: NewCardPageProps) {
  const { deckId } = await params;
  const deck = await getDeck().execute(deckId);

  if (!deck) {
    notFound();
  }

  const action = createCardAction.bind(null, deck.id);

  return (
    <>
      <header className="flex flex-col gap-xs">
        <Link
          className="text-label-md text-primary hover:underline"
          href={`/decks/${deck.id}`}
        >
          ← Back to {deck.title}
        </Link>
        <h1 className="text-headline-md">New card</h1>
        <p className="text-body-md text-on-surface-variant">
          Keep it to a single concept with a question on the front.
        </p>
      </header>

      <CardForm action={action} pendingLabel="Adding..." submitLabel="Add card" />
    </>
  );
}

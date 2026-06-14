import Link from "next/link";
import { notFound } from "next/navigation";
import { updateDeckAction } from "@/app/(app)/decks/actions";
import { getDeck } from "@/composition-root";
import { DeckForm } from "@/features/decks/ui/deck-form";

interface EditDeckPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function EditDeckPage({ params }: EditDeckPageProps) {
  const { deckId } = await params;
  const deck = await getDeck().execute(deckId);

  if (!deck) {
    notFound();
  }

  const action = updateDeckAction.bind(null, deck.id);

  return (
    <>
      <header className="flex flex-col gap-xs">
        <Link
          className="text-label-md text-primary hover:underline"
          href={`/decks/${deck.id}`}
        >
          ← Back to deck
        </Link>
        <h1 className="text-headline-md">Edit deck</h1>
      </header>

      <DeckForm
        action={action}
        defaultValues={{
          title: deck.title,
          description: deck.description ?? undefined,
        }}
        pendingLabel="Saving..."
        submitLabel="Save changes"
      />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { updateDeckAction } from "@/app/(app)/decks/actions";
import { getAuthGateway, getDeckRepository } from "@/composition-root";
import { DeckForm } from "@/features/decks/ui/deck-form";
import { getDeck } from "@/features/decks/use-cases/get-deck";

interface EditDeckPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function EditDeckPage({ params }: EditDeckPageProps) {
  const { deckId } = await params;
  const deck = await getDeck(deckId, getAuthGateway(), getDeckRepository());

  if (!deck) {
    notFound();
  }

  const action = updateDeckAction.bind(null, deck.id);

  return (
    <main className="min-h-dvh bg-surface px-margin-mobile py-lg text-on-surface">
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-lg">
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
      </div>
    </main>
  );
}

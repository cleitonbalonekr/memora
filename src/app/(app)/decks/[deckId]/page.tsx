import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDeckAction } from "@/app/(app)/decks/actions";
import { getAuthGateway, getDeckRepository } from "@/composition-root";
import { DeleteDeckButton } from "@/features/decks/ui/delete-deck-button";
import { getDeck } from "@/features/decks/use-cases/get-deck";

interface DeckPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { deckId } = await params;
  const deck = await getDeck(deckId, getAuthGateway(), getDeckRepository());

  if (!deck) {
    notFound();
  }

  const deleteAction = deleteDeckAction.bind(null, deck.id);

  return (
    <main className="min-h-dvh bg-surface px-margin-mobile py-lg text-on-surface">
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-lg">
        <header className="flex flex-col gap-md">
          <Link className="text-label-md text-primary hover:underline" href="/decks">
            ← Back to decks
          </Link>
          <div>
            <h1 className="text-display-lg-mobile text-on-surface">{deck.title}</h1>
            {deck.description ? (
              <p className="mt-xs text-body-md text-on-surface-variant">
                {deck.description}
              </p>
            ) : null}
          </div>
          <div className="flex gap-md">
            <Link
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest px-md text-label-md text-primary transition hover:bg-surface-container-low"
              href={`/decks/${deck.id}/edit`}
            >
              Edit deck
            </Link>
            <div className="flex-1">
              <DeleteDeckButton action={deleteAction} deckTitle={deck.title} />
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-md">
          <div className="flex min-h-[140px] flex-col justify-center gap-sm text-center">
            <h2 className="text-headline-sm">No cards yet</h2>
            <p className="text-body-md text-on-surface-variant">
              Card creation lands in the next epic.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

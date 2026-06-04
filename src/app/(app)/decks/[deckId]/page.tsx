import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDeckAction } from "@/app/(app)/decks/actions";
import {
  getAuthGateway,
  getCardRepository,
  getDeckRepository,
} from "@/composition-root";
import { CardList } from "@/features/cards/ui/card-list";
import { listCards } from "@/features/cards/use-cases/list-cards";
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

  const cards = await listCards(deck.id, getAuthGateway(), getCardRepository());
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

        <section className="flex flex-col gap-md">
          <div className="flex items-center justify-between gap-md">
            <h2 className="text-label-sm uppercase tracking-wider text-on-surface-variant">
              All cards
            </h2>
            <Link
              className="flex h-10 items-center justify-center rounded-xl bg-primary px-md text-label-md text-on-primary shadow-level1 transition hover:bg-surface-tint"
              href={`/decks/${deck.id}/cards/new`}
            >
              Add card
            </Link>
          </div>
          <CardList cards={cards} />
        </section>
      </div>
    </main>
  );
}

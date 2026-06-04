import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteCardAction,
  updateCardAction,
} from "@/app/(app)/decks/[deckId]/cards/actions";
import { getAuthGateway, getCardRepository } from "@/composition-root";
import { CardForm } from "@/features/cards/ui/card-form";
import { DeleteCardButton } from "@/features/cards/ui/delete-card-button";
import { getCard } from "@/features/cards/use-cases/get-card";

interface EditCardPageProps {
  params: Promise<{ deckId: string; cardId: string }>;
}

export default async function EditCardPage({ params }: EditCardPageProps) {
  const { deckId, cardId } = await params;
  const card = await getCard(cardId, getAuthGateway(), getCardRepository());

  if (!card) {
    notFound();
  }

  const action = updateCardAction.bind(null, deckId, card.id);
  const deleteAction = deleteCardAction.bind(null, deckId, card.id);

  return (
    <main className="min-h-dvh bg-surface px-margin-mobile py-lg text-on-surface">
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <Link
            className="text-label-md text-primary hover:underline"
            href={`/decks/${deckId}`}
          >
            ← Back to deck
          </Link>
          <h1 className="text-headline-md">Edit card</h1>
        </header>

        <CardForm
          action={action}
          defaultValues={{ front: card.frontText, back: card.backText }}
          pendingLabel="Saving..."
          submitLabel="Save changes"
        />

        <DeleteCardButton action={deleteAction} />
      </div>
    </main>
  );
}

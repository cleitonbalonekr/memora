import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeck, getStartStudySession } from "@/composition-root";
import { StudyRunner } from "@/features/study/ui/study-runner";

interface StudyPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { deckId } = await params;
  const deck = await getDeck().execute(deckId);

  if (!deck) {
    notFound();
  }

  const cards = await getStartStudySession().execute(deck.id);

  if (cards.length === 0) {
    return (
      <>
        <header className="flex flex-col gap-xs">
          <Link
            className="text-label-md text-primary hover:underline"
            href={`/decks/${deck.id}`}
          >
            ← Back to deck
          </Link>
          <h1 className="text-headline-md">Nothing to study yet</h1>
        </header>
        <section className="flex min-h-[140px] flex-col items-center justify-center gap-md rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-md text-center">
          <p className="text-body-md text-on-surface-variant">
            Add cards to this deck before starting a study session.
          </p>
          <Link
            className="flex h-12 items-center justify-center rounded-xl bg-primary px-lg text-label-md text-on-primary shadow-level1 transition hover:bg-surface-tint"
            href={`/decks/${deck.id}/cards/new`}
          >
            Add a card
          </Link>
        </section>
      </>
    );
  }

  return <StudyRunner cards={cards} deckId={deck.id} deckTitle={deck.title} />;
}

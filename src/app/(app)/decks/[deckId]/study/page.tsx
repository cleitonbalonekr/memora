import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAuthGateway,
  getCardRepository,
  getDeckRepository,
} from "@/composition-root";
import { StudyRunner } from "@/features/study/ui/study-runner";
import { startStudySession } from "@/features/study/use-cases/start-study-session";
import { getDeck } from "@/features/decks/use-cases/get-deck";

interface StudyPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { deckId } = await params;
  const deck = await getDeck(deckId, getAuthGateway(), getDeckRepository());

  if (!deck) {
    notFound();
  }

  const cards = await startStudySession(
    deck.id,
    getAuthGateway(),
    getCardRepository(),
  );

  if (cards.length === 0) {
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
        </div>
      </main>
    );
  }

  return <StudyRunner cards={cards} deckId={deck.id} deckTitle={deck.title} />;
}

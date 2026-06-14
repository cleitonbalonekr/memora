import Link from "next/link";
import { notFound } from "next/navigation";
import { generateDraftsAction, saveDraftsAction } from "./actions";
import { getDeck } from "@/composition-root";
import { DraftReview } from "@/features/ai/ui/draft-review";

interface GeneratePageProps {
  params: Promise<{ deckId: string }>;
}

export default async function GeneratePage({ params }: GeneratePageProps) {
  const { deckId } = await params;
  const deck = await getDeck().execute(deckId);

  if (!deck) {
    notFound();
  }

  // Bind deckId server-side so the client never supplies the target deck.
  const generateAction = generateDraftsAction.bind(null, deck.id);
  const saveAction = saveDraftsAction.bind(null, deck.id);

  return (
    <>
      <header className="flex flex-col gap-xs">
        <Link
          className="text-label-md text-primary hover:underline"
          href={`/decks/${deck.id}`}
        >
          ← Back to {deck.title}
        </Link>
        <h1 className="text-headline-md">Generate with AI</h1>
        <p className="text-body-md text-on-surface-variant">
          Enter a topic or paste notes, then review and edit the drafts before
          saving them to this deck.
        </p>
      </header>

      <DraftReview
        deckId={deck.id}
        deckTitle={deck.title}
        generateAction={generateAction}
        saveAction={saveAction}
      />
    </>
  );
}

import Link from "next/link";
import { createDeckAction } from "@/app/(app)/decks/actions";
import { DeckForm } from "@/features/decks/ui/deck-form";

export default function NewDeckPage() {
  return (
    <>
      <header className="flex flex-col gap-xs">
        <Link
          className="text-label-md text-primary hover:underline"
          href="/decks"
        >
          ← Back to decks
        </Link>
        <h1 className="text-headline-md">New deck</h1>
        <p className="text-body-md text-on-surface-variant">
          Give your deck a title. You can add cards once it exists.
        </p>
      </header>

      <DeckForm
        action={createDeckAction}
        pendingLabel="Creating..."
        submitLabel="Create deck"
      />
    </>
  );
}

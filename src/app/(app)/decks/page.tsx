import Link from "next/link";
import { getListDecks } from "@/composition-root";
import { LogoutButton } from "@/features/auth/ui/logout-button";
import { DeckList } from "@/features/decks/ui/deck-list";

export default async function DecksPage() {
  const decks = await getListDecks().execute();

  return (
    <main className="min-h-dvh bg-surface px-margin-mobile py-lg text-on-surface">
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-lg">
        <header className="flex items-center justify-between gap-md">
          <div>
            <p className="text-label-sm uppercase text-on-surface-variant">Memora</p>
            <h1 className="text-headline-md">Decks</h1>
          </div>
          <LogoutButton />
        </header>

        {decks.length === 0 ? (
          <section className="flex min-h-[180px] flex-col items-center justify-center gap-md rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-md text-center">
            <div className="flex flex-col gap-sm">
              <h2 className="text-headline-sm">No decks yet</h2>
              <p className="text-body-md text-on-surface-variant">
                Create your first deck to start building cards.
              </p>
            </div>
            <Link
              className="flex h-12 items-center justify-center rounded-xl bg-primary px-lg text-label-md text-on-primary shadow-level1 transition hover:bg-surface-tint"
              href="/decks/new"
            >
              Create your first deck
            </Link>
          </section>
        ) : (
          <>
            <Link
              className="flex h-12 items-center justify-center rounded-xl bg-primary px-lg text-label-md text-on-primary shadow-level1 transition hover:bg-surface-tint"
              href="/decks/new"
            >
              New deck
            </Link>
            <DeckList decks={decks} />
          </>
        )}
      </div>
    </main>
  );
}

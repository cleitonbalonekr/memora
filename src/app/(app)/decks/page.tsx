import { DrizzleDeckRepository } from "@/adapters/db/drizzle-deck-repository";
import { SupabaseAuthGateway } from "@/adapters/auth/supabase-auth-gateway";
import { LogoutButton } from "@/features/auth/ui/logout-button";
import { listDecks } from "@/features/decks/use-cases/list-decks";

export default async function DecksPage() {
  const decks = await listDecks(
    new SupabaseAuthGateway(),
    new DrizzleDeckRepository()
  );

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

        <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-md">
          {decks.length === 0 ? (
            <div className="flex min-h-[180px] flex-col justify-center gap-sm text-center">
              <h2 className="text-headline-sm">No decks yet</h2>
              <p className="text-body-md text-on-surface-variant">
                Your protected app home is ready. Deck creation lands in the next epic.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-outline-variant/50">
              {decks.map((deck) => (
                <li className="py-md" key={deck.id}>
                  <h2 className="text-headline-sm">{deck.title}</h2>
                  {deck.description ? (
                    <p className="mt-xs text-body-md text-on-surface-variant">
                      {deck.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { CheckCircle2, Flame } from "lucide-react";
import { getListDecks } from "@/composition-root";
import { DeckList } from "@/features/decks/ui/deck-list";

// TODO: Streak and Studied-Today are not tracked by the system yet. These are
// hardcoded placeholder values, NOT real data — wire them to real metrics when
// study tracking lands. See dashboard-overview spec.
const PLACEHOLDER_STATS = [
  {
    label: "Current Streak",
    value: "14",
    unit: "days",
    icon: Flame,
    accent: "text-tertiary",
  },
  {
    label: "Studied Today",
    value: "42",
    unit: "cards",
    icon: CheckCircle2,
    accent: "text-primary",
  },
];

export default async function DashboardPage() {
  const decks = await getListDecks().execute();

  return (
    <>
      <section>
        <h1 className="text-display-lg-mobile text-on-surface">Welcome back</h1>
        <p className="mt-sm text-body-lg text-on-surface-variant">
          Ready to crush your study goals today?
        </p>
      </section>

      <section className="grid grid-cols-1 gap-md md:grid-cols-2">
        {PLACEHOLDER_STATS.map(({ label, value, unit, icon: Icon, accent }) => (
          <div
            className="flex items-center justify-between rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-lg shadow-level1"
            key={label}
          >
            <div>
              <p className="mb-xs text-label-md text-on-surface-variant">
                {label}
              </p>
              <p className="flex items-baseline gap-xs text-headline-md text-on-surface">
                {value}
                <span className="text-body-md text-on-surface-variant">
                  {unit}
                </span>
              </p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low ${accent}`}
            >
              <Icon aria-hidden="true" className="h-6 w-6" />
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-md">
        <div className="flex items-end justify-between">
          <h2 className="text-headline-sm text-on-surface">Recent Decks</h2>
          <Link
            className="text-label-md text-primary hover:underline"
            href="/decks"
          >
            View all
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center gap-md rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-md text-center">
            <p className="text-body-md text-on-surface-variant">
              You have no decks yet. Create your first deck to start studying.
            </p>
            <Link
              className="flex h-12 items-center justify-center rounded-xl bg-primary px-lg text-label-md text-on-primary shadow-level1 transition hover:bg-surface-tint"
              href="/decks/new"
            >
              Create your first deck
            </Link>
          </div>
        ) : (
          <DeckList decks={decks} />
        )}
      </section>
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createSession,
  currentCard,
  isComplete,
  progress,
  recordResult,
  reveal,
  StudyCard as StudyCardModel,
} from "@/features/study/domain/study-session";
import { SessionComplete } from "./session-complete";
import { StudyCard } from "./study-card";
import { StudyProgress } from "./study-progress";

interface StudyRunnerProps {
  deckId: string;
  deckTitle: string;
  cards: StudyCardModel[];
}

export function StudyRunner({ deckId, deckTitle, cards }: StudyRunnerProps) {
  const [session, setSession] = useState(() => createSession(cards));

  const { completed, total } = progress(session);
  const card = currentCard(session);

  return (
    <main className="flex min-h-dvh flex-col bg-surface px-margin-mobile py-lg text-on-surface">
      <div className="mx-auto flex w-full max-w-[600px] flex-1 flex-col gap-lg">
        <header className="flex items-center justify-between gap-md">
          <Link
            aria-label="Close study session"
            className="text-label-md text-on-surface-variant hover:text-primary"
            href={`/decks/${deckId}`}
          >
            Close
          </Link>
          <h1 className="truncate text-headline-sm text-on-surface">{deckTitle}</h1>
          <span className="w-10" aria-hidden />
        </header>

        <StudyProgress completed={completed} total={total} />

        {isComplete(session) || !card ? (
          <SessionComplete
            clearedCount={completed}
            deckId={deckId}
            onRestart={() => setSession(createSession(cards))}
          />
        ) : (
          <>
            <StudyCard
              card={card}
              onReveal={() => setSession(reveal(session))}
              revealed={session.revealed}
            />
            {session.revealed ? (
              <div className="flex gap-md">
                <button
                  className="flex h-14 flex-1 items-center justify-center rounded-xl border-2 border-tertiary px-md text-headline-sm text-tertiary transition hover:bg-tertiary-container active:scale-95"
                  onClick={() => setSession(recordResult(session, "review_again"))}
                  type="button"
                >
                  Review again
                </button>
                <button
                  className="flex h-14 flex-1 items-center justify-center rounded-xl bg-secondary px-md text-headline-sm text-on-secondary transition hover:bg-secondary-fixed active:scale-95"
                  onClick={() => setSession(recordResult(session, "got_it"))}
                  type="button"
                >
                  Got it
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  StudySession,
  StudyCard as StudyCardModel,
} from "@/features/study/domain/study-session";
import { ReviewGrade } from "@/features/study/domain/scheduler";
import { SessionComplete } from "./session-complete";
import { StudyCard } from "./study-card";
import { StudyProgress } from "./study-progress";
import { reviewCardAction } from "@/app/(app)/decks/[deckId]/study/actions";

interface StudyRunnerProps {
  deckId: string;
  deckTitle: string;
  cards: StudyCardModel[];
}

// The four grading buttons. "again" keeps the card in today's session; the other
// three schedule it forward and clear it. Order runs hardest -> easiest.
const GRADES: { grade: ReviewGrade; label: string; className: string }[] = [
  {
    grade: "again",
    label: "Don't know",
    className:
      "border-2 border-tertiary text-tertiary hover:bg-tertiary-container",
  },
  {
    grade: "hard",
    label: "Hard",
    className:
      "border-2 border-outline text-on-surface hover:bg-surface-container-high",
  },
  {
    grade: "good",
    label: "Medium",
    className: "bg-secondary text-on-secondary hover:bg-secondary-fixed",
  },
  {
    grade: "easy",
    label: "Easy",
    className: "bg-primary text-on-primary hover:bg-surface-tint",
  },
];

export function StudyRunner({ deckId, deckTitle, cards }: StudyRunnerProps) {
  const [session, setSession] = useState(() => StudySession.create(cards));
  const [isPending, startTransition] = useTransition();

  const { completed, total } = session.progress();
  const card = session.currentCard();

  // Persist the grade per-press, then advance the in-memory session. Persistence
  // is fire-and-advance so a closed tab keeps the recorded review; the in-session
  // round-robin (again requeues, a passing grade clears) drives what is shown next.
  function handleGrade(grade: ReviewGrade) {
    if (!card) {
      return;
    }
    const cardId = card.id;
    startTransition(async () => {
      await reviewCardAction({ cardId, grade });
      setSession((current) => current.recordResult(grade));
    });
  }

  return (
    <>
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

      {session.isComplete() || !card ? (
        <SessionComplete
          clearedCount={completed}
          deckId={deckId}
          onRestart={() => setSession(StudySession.create(cards))}
        />
      ) : (
        <>
          <StudyCard
            card={card}
            onReveal={() => setSession(session.reveal())}
            revealed={session.revealed}
          />
          {session.revealed ? (
            <div className="grid grid-cols-2 gap-md">
              {GRADES.map(({ grade, label, className }) => (
                <button
                  key={grade}
                  className={`flex h-14 items-center justify-center rounded-xl px-md text-headline-sm transition active:scale-95 disabled:opacity-60 ${className}`}
                  disabled={isPending}
                  onClick={() => handleGrade(grade)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

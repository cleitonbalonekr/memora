export type StudyOutcome = "got_it" | "review_again";

export interface StudyCard {
  id: string;
  frontText: string;
  backText: string;
}

export interface StudySession {
  // Remaining cards; the head is the current card. Empty when the session is done.
  queue: StudyCard[];
  // Whether the back of the current card is showing.
  revealed: boolean;
  // Count of unique cards the session started with (drives the progress total).
  total: number;
  // Unique cards cleared with "got it" (drives the progress count).
  gotItIds: string[];
}

export function createSession(cards: StudyCard[]): StudySession {
  return {
    queue: [...cards],
    revealed: false,
    total: cards.length,
    gotItIds: [],
  };
}

export function reveal(session: StudySession): StudySession {
  if (session.revealed) {
    return session;
  }
  return { ...session, revealed: true };
}

export function recordResult(
  session: StudySession,
  outcome: StudyOutcome,
): StudySession {
  const [current, ...rest] = session.queue;
  if (!current) {
    return session;
  }

  if (outcome === "got_it") {
    const gotItIds = session.gotItIds.includes(current.id)
      ? session.gotItIds
      : [...session.gotItIds, current.id];
    return { ...session, queue: rest, revealed: false, gotItIds };
  }

  // "review_again": send the current card to the tail so it returns later.
  return { ...session, queue: [...rest, current], revealed: false };
}

export function currentCard(session: StudySession): StudyCard | null {
  return session.queue[0] ?? null;
}

export function isComplete(session: StudySession): boolean {
  return session.queue.length === 0;
}

export function progress(session: StudySession): {
  completed: number;
  total: number;
} {
  return { completed: session.gotItIds.length, total: session.total };
}

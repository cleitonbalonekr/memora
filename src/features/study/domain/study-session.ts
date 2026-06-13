import { ReviewGrade } from "./scheduler";

export interface StudyCard {
  id: string;
  frontText: string;
  backText: string;
}

// An in-session study run, modeled as an immutable value object: every method
// returns a new `StudySession` rather than mutating in place. The UI holds it in
// React state and relies on a fresh identity to re-render, so mutation would
// silently break rendering. This is pure domain logic — no I/O, no clock.
export class StudySession {
  private constructor(
    // Remaining cards; the head is the current card. Empty when the session is done.
    private readonly queue: StudyCard[],
    // Whether the back of the current card is showing.
    private readonly _revealed: boolean,
    // Count of unique cards the session started with (drives the progress total).
    private readonly total: number,
    // Unique cards cleared with a passing grade (drives the progress count).
    private readonly clearedIds: string[],
  ) {}

  static create(cards: StudyCard[]): StudySession {
    return new StudySession([...cards], false, cards.length, []);
  }

  get revealed(): boolean {
    return this._revealed;
  }

  reveal(): StudySession {
    if (this._revealed) {
      return this;
    }
    return new StudySession(this.queue, true, this.total, this.clearedIds);
  }

  recordResult(grade: ReviewGrade): StudySession {
    const [current, ...rest] = this.queue;
    if (!current) {
      return this;
    }

    // "again" is the only grade that keeps the card in today's session: send it
    // to the tail so it returns later. "hard | good | easy" clear it from the queue.
    if (grade === "again") {
      return new StudySession(
        [...rest, current],
        false,
        this.total,
        this.clearedIds,
      );
    }

    const clearedIds = this.clearedIds.includes(current.id)
      ? this.clearedIds
      : [...this.clearedIds, current.id];
    return new StudySession(rest, false, this.total, clearedIds);
  }

  currentCard(): StudyCard | null {
    return this.queue[0] ?? null;
  }

  isComplete(): boolean {
    return this.queue.length === 0;
  }

  progress(): { completed: number; total: number } {
    return { completed: this.clearedIds.length, total: this.total };
  }
}

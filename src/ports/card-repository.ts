import { SrsState } from "@/features/study/domain/scheduler";

export interface Card {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
  dueDate: Date | null;
  firstReviewedAt: Date | null;
  suspendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCardInput {
  deckId: string;
  frontText: string;
  backText: string;
}

export interface UpdateCardInput {
  frontText?: string;
  backText?: string;
}

export interface CardRepository {
  create(input: CreateCardInput, userId: string): Promise<Card>;
  createMany(inputs: CreateCardInput[], userId: string): Promise<Card[]>;
  findById(id: string, userId: string): Promise<Card | null>;
  listByDeckId(deckId: string, userId: string): Promise<Card[]>;
  // Builds a day's study queue for an owned deck: due, non-suspended reviews
  // (dueDate <= today, most-overdue first) plus up to the remaining new-card
  // allowance for today (dueDate IS NULL, non-suspended, by createdAt).
  listDueForStudy(
    deckId: string,
    userId: string,
    today: Date,
    newLimit: number,
  ): Promise<Card[]>;
  update(id: string, userId: string, input: UpdateCardInput): Promise<Card>;
  // Persists the scheduler's output for an owned card (ownership-scoped).
  saveReviewState(cardId: string, userId: string, state: SrsState): Promise<void>;
  delete(id: string, userId: string): Promise<void>;
}

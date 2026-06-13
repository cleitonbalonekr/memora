import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { todayUtc } from "@/shared/today";
import { ReviewGrade, Scheduler, SrsState } from "@/features/study/domain/scheduler";

export interface ReviewCardInput {
  cardId: string;
  grade: ReviewGrade;
}

export type ReviewCardResult =
  | { status: "success"; intervalDays: number; dueDate: Date | null }
  | { status: "not_found" }
  | { status: "provider_error"; message: string };

// Records a single grade during a study session. It resolves the acting user
// server-side, loads the card's current SRS state scoped to that user, advances
// it through the pure scheduler, and persists the result before returning —
// per-press (not batched) so an interrupted session never loses progress.
export class ReviewCard extends AuthedUseCase<ReviewCardInput, ReviewCardResult> {
  private readonly scheduler = new Scheduler();

  constructor(
    auth: AuthGateway,
    private readonly cards: CardRepository,
  ) {
    super(auth);
  }

  protected async handle(
    user: SessionUser,
    { cardId, grade }: ReviewCardInput,
  ): Promise<ReviewCardResult> {
    const card = await this.cards.findById(cardId, user.id);
    if (!card) {
      return { status: "not_found" };
    }

    const current: SrsState = {
      intervalDays: card.intervalDays,
      ease: card.ease,
      reps: card.reps,
      lapses: card.lapses,
      dueDate: card.dueDate,
      firstReviewedAt: card.firstReviewedAt,
      suspendedAt: card.suspendedAt,
    };

    const next = this.scheduler.schedule(current, grade, todayUtc());
    await this.cards.saveReviewState(cardId, user.id, next);

    return { status: "success", intervalDays: next.intervalDays, dueDate: next.dueDate };
  }

  protected mapError(error: unknown): ReviewCardResult {
    if (error instanceof Error && /not found or unauthorized/i.test(error.message)) {
      return { status: "not_found" };
    }
    return {
      status: "provider_error",
      message: "We could not record this review. Try again.",
    };
  }
}

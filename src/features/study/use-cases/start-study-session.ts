import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { todayUtc } from "@/shared/today";
import { StudyCard } from "@/features/study/domain/study-session";
import { Scheduler } from "@/features/study/domain/scheduler";

// Builds the day's study queue for an owned deck: cards due for review today
// plus up to the daily new-card allowance, excluding suspended cards. Ownership
// is enforced by the repository (the deck join), so a non-owner deck is rejected.
export class StartStudySession extends AuthedUseCase<string, StudyCard[]> {
  private readonly scheduler = new Scheduler();

  constructor(
    auth: AuthGateway,
    private readonly cards: CardRepository,
  ) {
    super(auth);
  }

  protected async handle(user: SessionUser, deckId: string): Promise<StudyCard[]> {
    const cards = await this.cards.listDueForStudy(
      deckId,
      user.id,
      todayUtc(),
      this.scheduler.newCardsPerDay,
    );

    return cards.map((card) => ({
      id: card.id,
      frontText: card.frontText,
      backText: card.backText,
    }));
  }
}

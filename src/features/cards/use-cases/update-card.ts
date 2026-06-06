import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { CardUseCaseResult, mapCardError } from "./card-errors";
import { parseCardInput } from "./card-input";

export interface UpdateCardInput {
  cardId: string;
  formData: FormData;
}

export class UpdateCard extends AuthedUseCase<UpdateCardInput, CardUseCaseResult> {
  constructor(
    auth: AuthGateway,
    private readonly cards: CardRepository,
  ) {
    super(auth);
  }

  protected async handle(
    user: SessionUser,
    { cardId, formData }: UpdateCardInput,
  ): Promise<CardUseCaseResult> {
    const parsed = parseCardInput(formData);

    if (!parsed.input) {
      return {
        status: "invalid_input",
        fieldErrors: parsed.fieldErrors ?? {},
        message: "Check the highlighted fields.",
      };
    }

    const card = await this.cards.update(cardId, user.id, {
      frontText: parsed.input.frontText,
      backText: parsed.input.backText,
    });

    return { status: "success", card };
  }

  protected mapError(error: unknown): CardUseCaseResult {
    return mapCardError(error);
  }
}

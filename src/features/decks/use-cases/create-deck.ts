import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { DeckRepository } from "@/ports/deck-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { DeckUseCaseResult, mapDeckError } from "./deck-errors";
import { parseDeckInput } from "./deck-input";

export class CreateDeck extends AuthedUseCase<FormData, DeckUseCaseResult> {
  constructor(
    auth: AuthGateway,
    private readonly decks: DeckRepository,
  ) {
    super(auth);
  }

  protected async handle(
    user: SessionUser,
    formData: FormData,
  ): Promise<DeckUseCaseResult> {
    const parsed = parseDeckInput(formData);

    if (!parsed.input) {
      return {
        status: "invalid_input",
        fieldErrors: parsed.fieldErrors ?? {},
        message: "Check the highlighted fields.",
      };
    }

    const deck = await this.decks.create({
      userId: user.id,
      title: parsed.input.title,
      description: parsed.input.description,
    });

    return { status: "success", deck };
  }

  protected mapError(error: unknown): DeckUseCaseResult {
    return mapDeckError(error);
  }
}

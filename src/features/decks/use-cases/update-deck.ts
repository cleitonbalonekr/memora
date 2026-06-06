import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { DeckRepository } from "@/ports/deck-repository";
import { AuthedUseCase } from "@/shared/authed-use-case";
import { DeckUseCaseResult, mapDeckError } from "./deck-errors";
import { parseDeckInput } from "./deck-input";

export interface UpdateDeckInput {
  deckId: string;
  formData: FormData;
}

export class UpdateDeck extends AuthedUseCase<UpdateDeckInput, DeckUseCaseResult> {
  constructor(
    auth: AuthGateway,
    private readonly decks: DeckRepository,
  ) {
    super(auth);
  }

  protected async handle(
    user: SessionUser,
    { deckId, formData }: UpdateDeckInput,
  ): Promise<DeckUseCaseResult> {
    const parsed = parseDeckInput(formData);

    if (!parsed.input) {
      return {
        status: "invalid_input",
        fieldErrors: parsed.fieldErrors ?? {},
        message: "Check the highlighted fields.",
      };
    }

    const deck = await this.decks.update(deckId, user.id, {
      title: parsed.input.title,
      // An edit replaces the description; a cleared field becomes null.
      description: parsed.input.description ?? null,
    });

    return { status: "success", deck };
  }

  protected mapError(error: unknown): DeckUseCaseResult {
    return mapDeckError(error);
  }
}

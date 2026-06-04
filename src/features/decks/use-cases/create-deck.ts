import { AuthGateway } from "@/ports/auth-gateway";
import { DeckRepository } from "@/ports/deck-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";
import { DeckUseCaseResult, mapDeckError } from "./deck-errors";
import { parseDeckInput } from "./deck-input";

export async function createDeck(
  formData: FormData,
  authGateway: AuthGateway,
  deckRepository: DeckRepository,
): Promise<DeckUseCaseResult> {
  const user = await requireCurrentUser(authGateway);
  const parsed = parseDeckInput(formData);

  if (!parsed.input) {
    return {
      status: "invalid_input",
      fieldErrors: parsed.fieldErrors ?? {},
      message: "Check the highlighted fields.",
    };
  }

  try {
    const deck = await deckRepository.create({
      userId: user.id,
      title: parsed.input.title,
      description: parsed.input.description,
    });

    return { status: "success", deck };
  } catch (error) {
    return mapDeckError(error);
  }
}

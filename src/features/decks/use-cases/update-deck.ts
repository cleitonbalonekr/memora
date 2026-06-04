import { AuthGateway } from "@/ports/auth-gateway";
import { DeckRepository } from "@/ports/deck-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";
import { DeckUseCaseResult, mapDeckError } from "./deck-errors";
import { parseDeckInput } from "./deck-input";

export async function updateDeck(
  deckId: string,
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
    const deck = await deckRepository.update(deckId, user.id, {
      title: parsed.input.title,
      // An edit replaces the description; a cleared field becomes null.
      description: parsed.input.description ?? null,
    });

    return { status: "success", deck };
  } catch (error) {
    return mapDeckError(error);
  }
}

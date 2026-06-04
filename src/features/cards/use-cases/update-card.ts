import { AuthGateway } from "@/ports/auth-gateway";
import { CardRepository } from "@/ports/card-repository";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";
import { CardUseCaseResult, mapCardError } from "./card-errors";
import { parseCardInput } from "./card-input";

export async function updateCard(
  cardId: string,
  formData: FormData,
  authGateway: AuthGateway,
  cardRepository: CardRepository,
): Promise<CardUseCaseResult> {
  const user = await requireCurrentUser(authGateway);
  const parsed = parseCardInput(formData);

  if (!parsed.input) {
    return {
      status: "invalid_input",
      fieldErrors: parsed.fieldErrors ?? {},
      message: "Check the highlighted fields.",
    };
  }

  try {
    const card = await cardRepository.update(cardId, user.id, {
      frontText: parsed.input.frontText,
      backText: parsed.input.backText,
    });

    return { status: "success", card };
  } catch (error) {
    return mapCardError(error);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthGateway, getCardRepository } from "@/composition-root";
import { createCard } from "@/features/cards/use-cases/create-card";
import { deleteCard } from "@/features/cards/use-cases/delete-card";
import { updateCard } from "@/features/cards/use-cases/update-card";
import { FormState } from "@/shared/actions/form-state";

// deckId is bound server-side (action.bind) so the target deck is never taken
// from client-supplied form data; ownership is enforced in the repository.
export async function createCardAction(
  deckId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await createCard(
    deckId,
    formData,
    getAuthGateway(),
    getCardRepository(),
  );

  switch (result.status) {
    case "success":
      revalidatePath(`/decks/${deckId}`);
      redirect(`/decks/${deckId}`);
    case "invalid_input":
      return {
        status: "error",
        message: result.message,
        fieldErrors: result.fieldErrors,
      };
    case "not_found":
      return {
        status: "error",
        message: "We could not find that deck.",
      };
    case "provider_error":
      return {
        status: "error",
        message: result.message,
      };
  }
}

// deckId and cardId are bound server-side (action.bind) so neither is taken from
// client-supplied form data; ownership is enforced in the repository.
export async function updateCardAction(
  deckId: string,
  cardId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await updateCard(
    cardId,
    formData,
    getAuthGateway(),
    getCardRepository(),
  );

  switch (result.status) {
    case "success":
      revalidatePath(`/decks/${deckId}`);
      redirect(`/decks/${deckId}`);
    case "invalid_input":
      return {
        status: "error",
        message: result.message,
        fieldErrors: result.fieldErrors,
      };
    case "not_found":
      return {
        status: "error",
        message: "We could not find that card.",
      };
    case "provider_error":
      return {
        status: "error",
        message: result.message,
      };
  }
}

// deckId and cardId are bound server-side (action.bind). A provider error is
// surfaced (not swallowed); a missing card and a successful delete both land
// back on the deck view.
export async function deleteCardAction(
  deckId: string,
  cardId: string,
): Promise<void> {
  const result = await deleteCard(cardId, getAuthGateway(), getCardRepository());

  if (result.status === "provider_error") {
    throw new Error(result.message);
  }

  revalidatePath(`/decks/${deckId}`);
  redirect(`/decks/${deckId}`);
}

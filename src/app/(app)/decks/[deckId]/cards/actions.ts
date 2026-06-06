"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCreateCard, getDeleteCard, getUpdateCard } from "@/composition-root";
import { FormState } from "@/shared/actions/form-state";

// deckId is bound server-side (action.bind) so the target deck is never taken
// from client-supplied form data; ownership is enforced in the repository.
export async function createCardAction(
  deckId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await getCreateCard().execute({ deckId, formData });

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
  const result = await getUpdateCard().execute({ cardId, formData });

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
  const result = await getDeleteCard().execute(cardId);

  if (result.status === "provider_error") {
    throw new Error(result.message);
  }

  revalidatePath(`/decks/${deckId}`);
  redirect(`/decks/${deckId}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCreateDeck, getDeleteDeck, getUpdateDeck } from "@/composition-root";
import { FormState } from "@/shared/actions/form-state";

export async function createDeckAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await getCreateDeck().execute(formData);

  switch (result.status) {
    case "success":
      redirect(`/decks/${result.deck.id}`);
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

// deckId is bound server-side (action.bind) so the deleted deck is never taken
// from client-supplied form data. A provider error is surfaced (not swallowed);
// a missing deck and a successful delete both land back on the decks list.
export async function deleteDeckAction(deckId: string): Promise<void> {
  const result = await getDeleteDeck().execute(deckId);

  if (result.status === "provider_error") {
    throw new Error(result.message);
  }

  revalidatePath("/decks");
  redirect("/decks");
}

// deckId is bound server-side (action.bind) so the edited deck is never taken
// from client-supplied form data.
export async function updateDeckAction(
  deckId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await getUpdateDeck().execute({ deckId, formData });

  switch (result.status) {
    case "success":
      redirect(`/decks/${result.deck.id}`);
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

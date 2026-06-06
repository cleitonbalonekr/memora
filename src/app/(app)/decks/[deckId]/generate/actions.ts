"use server";

import { revalidatePath } from "next/cache";
import { getGenerateCardDrafts, getSaveSelectedDrafts } from "@/composition-root";
import { CardDraft } from "@/ports/ai-card-generator";

// Serializable results returned to the client review component. deckId is bound
// server-side (action.bind) so the target deck is never taken from client form
// data; ownership is enforced in the use cases (mirrors cards/actions.ts).

export type GenerateDraftsActionResult =
  | { status: "success"; drafts: CardDraft[] }
  | { status: "error"; message: string };

export type SaveDraftsActionResult =
  | { status: "success"; savedCount: number }
  | { status: "error"; message: string };

export async function generateDraftsAction(
  deckId: string,
  topicOrNotes: string,
): Promise<GenerateDraftsActionResult> {
  const result = await getGenerateCardDrafts().execute({ deckId, topicOrNotes });

  switch (result.status) {
    case "success":
      return { status: "success", drafts: result.drafts };
    case "invalid_input":
    case "rate_limited":
    case "provider_error":
      return { status: "error", message: result.message };
    case "not_found":
      return { status: "error", message: "We could not find that deck." };
  }
}

export async function saveDraftsAction(
  deckId: string,
  drafts: CardDraft[],
): Promise<SaveDraftsActionResult> {
  const result = await getSaveSelectedDrafts().execute({ deckId, drafts });

  switch (result.status) {
    case "success":
      revalidatePath(`/decks/${deckId}`);
      return { status: "success", savedCount: result.savedCount };
    case "invalid_input":
    case "provider_error":
      return { status: "error", message: result.message };
    case "not_found":
      return { status: "error", message: "We could not find that deck." };
  }
}

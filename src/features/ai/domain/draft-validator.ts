import { validateCard } from "@/features/cards/domain/card-rules";
import { CardDraft } from "@/features/ai/domain/draft-schema";

// Normalizes and filters raw model drafts against the shared card rules so a user
// never sees a draft that cannot be saved (design D4). Trims both sides, drops
// any draft with an empty or over-cap side (reusing validateCard — the single
// source of the length cap), and caps the result to maxDrafts. Pure.

export function validateDrafts(drafts: CardDraft[], maxDrafts: number): CardDraft[] {
  const valid: CardDraft[] = [];

  for (const draft of drafts) {
    const frontText = draft.frontText.trim();
    const backText = draft.backText.trim();

    const { errors } = validateCard({ front: frontText, back: backText });
    if (Object.keys(errors).length > 0) {
      continue;
    }

    valid.push({ frontText, backText });
    if (valid.length >= maxDrafts) {
      break;
    }
  }

  return valid;
}

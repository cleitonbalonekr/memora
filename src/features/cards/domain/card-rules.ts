// Single source of truth for flashcard rules. Shared by the manual card editor
// and (later) the AI draft validator (Epic F), so the limits live in one place.

// Hard cap per side: input over this is rejected.
export const CARD_SIDE_MAX = 500;
// Soft target per side: input over this yields a non-blocking hint. Reflects the
// PRD goal that most card sides stay under 200 characters for effective recall.
export const CARD_SIDE_RECOMMENDED = 200;

export interface CardFields {
  front: string;
  back: string;
}

export interface CardValidation {
  // Field-keyed messages that block saving ("front" / "back").
  errors: Record<string, string>;
  // Non-blocking guidance toward short, single-concept, question-first cards.
  hints: string[];
}

export function validateCard(fields: CardFields): CardValidation {
  const front = fields.front.trim();
  const back = fields.back.trim();

  const errors: Record<string, string> = {};
  if (front.length === 0) {
    errors.front = "Enter the front (the question or prompt).";
  } else if (front.length > CARD_SIDE_MAX) {
    errors.front = `Use at most ${CARD_SIDE_MAX} characters.`;
  }

  if (back.length === 0) {
    errors.back = "Enter the back (the answer).";
  } else if (back.length > CARD_SIDE_MAX) {
    errors.back = `Use at most ${CARD_SIDE_MAX} characters.`;
  }

  const hints: string[] = [];
  if (front.length > CARD_SIDE_RECOMMENDED || back.length > CARD_SIDE_RECOMMENDED) {
    hints.push(
      `Shorter cards recall better — aim for under ${CARD_SIDE_RECOMMENDED} characters per side.`,
    );
  }
  if (front.length > 0 && !front.endsWith("?")) {
    hints.push("Phrase the front as a question to practice active recall.");
  }
  if (looksMultiConcept(front)) {
    hints.push("Keep each card to a single concept — consider splitting this one.");
  }

  return { errors, hints };
}

function looksMultiConcept(front: string): boolean {
  const trimmed = front.trim();
  if (/\band\b/i.test(trimmed)) {
    return true;
  }
  const sentences = trimmed.split(/[.!?]+/).filter((part) => part.trim().length > 0);
  return sentences.length > 1;
}

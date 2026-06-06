import { CARD_SIDE_MAX, CARD_SIDE_RECOMMENDED } from "@/features/cards/domain/card-rules";

// Pure prompt construction (design D3). Encodes the effective-flashcard rules so
// the model returns short, single-concept, question-first drafts within the
// shared per-side cap, and asks for a strict JSON shape so the adapter can parse
// and validate the response. No I/O — unit-testable.

export interface BuildPromptInput {
  topicOrNotes: string;
  maxDrafts: number;
}

export interface GenerationPrompt {
  system: string;
  user: string;
}

// A worked example anchors the model on the exact JSON shape and the card style.
const WORKED_EXAMPLE = JSON.stringify({
  drafts: [
    {
      frontText: "What is the largest bone in the human body?",
      backText: "The femur (thigh bone).",
    },
  ],
});

export function buildSystemPrompt(): string {
  return [
    "You write flashcards for active-recall study.",
    "Follow these rules for every card:",
    "- The front is a single, clear question; phrase it as a question.",
    "- Each card covers a single concept — never combine ideas.",
    "- Keep each side short: aim for under " +
      `${CARD_SIDE_RECOMMENDED} characters and never exceed ${CARD_SIDE_MAX} characters.`,
    "- The back is the concise answer to the front, nothing more.",
    "",
    'Respond with ONLY a JSON object of the shape {"drafts":[{"frontText":string,"backText":string}]}.',
    "Do not wrap it in markdown, code fences, or prose.",
    `Example: ${WORKED_EXAMPLE}`,
  ].join("\n");
}

export function buildUserPrompt(input: BuildPromptInput): string {
  return [
    `Create up to ${input.maxDrafts} flashcards from the topic or notes below.`,
    "Return fewer if the material does not support that many good single-concept cards.",
    "",
    "Topic or notes:",
    input.topicOrNotes.trim(),
  ].join("\n");
}

export function buildGenerationPrompt(input: BuildPromptInput): GenerationPrompt {
  return {
    system: buildSystemPrompt(),
    user: buildUserPrompt(input),
  };
}

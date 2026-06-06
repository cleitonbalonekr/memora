import { describe, expect, it } from "vitest";
import { CARD_SIDE_MAX } from "@/features/cards/domain/card-rules";
import { buildGenerationPrompt } from "./prompt-builder";

describe("buildGenerationPrompt", () => {
  it("encodes the flashcard rules and the per-side cap in the system prompt", () => {
    const { system } = buildGenerationPrompt({ topicOrNotes: "Mitosis", maxDrafts: 5 });

    expect(system).toMatch(/single concept/i);
    expect(system).toMatch(/question/i);
    expect(system).toContain(String(CARD_SIDE_MAX));
  });

  it("asks for the strict JSON drafts shape", () => {
    const { system } = buildGenerationPrompt({ topicOrNotes: "Mitosis", maxDrafts: 5 });

    expect(system).toMatch(/"drafts"/);
    expect(system).toMatch(/frontText/);
    expect(system).toMatch(/backText/);
  });

  it("reflects the requested draft count and the topic in the user prompt", () => {
    const { user } = buildGenerationPrompt({
      topicOrNotes: "The water cycle",
      maxDrafts: 7,
    });

    expect(user).toContain("7");
    expect(user).toContain("The water cycle");
  });
});

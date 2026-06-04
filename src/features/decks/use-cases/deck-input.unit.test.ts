import { describe, expect, it } from "vitest";
import {
  DECK_DESCRIPTION_MAX,
  DECK_TITLE_MAX,
  parseDeckInput,
} from "./deck-input";

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe("parseDeckInput", () => {
  it("accepts a title and trims surrounding whitespace", () => {
    const { input, fieldErrors } = parseDeckInput(
      formData({ title: "  Spanish  ", description: "" }),
    );

    expect(fieldErrors).toBeUndefined();
    expect(input).toEqual({ title: "Spanish", description: undefined });
  });

  it("keeps a trimmed description when present", () => {
    const { input } = parseDeckInput(
      formData({ title: "Biology", description: "  Cell unit  " }),
    );

    expect(input).toEqual({ title: "Biology", description: "Cell unit" });
  });

  it("rejects an empty or whitespace-only title", () => {
    const { input, fieldErrors } = parseDeckInput(
      formData({ title: "   ", description: "" }),
    );

    expect(input).toBeUndefined();
    expect(fieldErrors?.title).toBe("Enter a title for the deck.");
  });

  it("rejects a title over the cap", () => {
    const { fieldErrors } = parseDeckInput(
      formData({ title: "a".repeat(DECK_TITLE_MAX + 1) }),
    );

    expect(fieldErrors?.title).toBe(`Use at most ${DECK_TITLE_MAX} characters.`);
  });

  it("rejects a description over the cap", () => {
    const { fieldErrors } = parseDeckInput(
      formData({
        title: "Biology",
        description: "a".repeat(DECK_DESCRIPTION_MAX + 1),
      }),
    );

    expect(fieldErrors?.description).toBe(
      `Use at most ${DECK_DESCRIPTION_MAX} characters.`,
    );
  });
});

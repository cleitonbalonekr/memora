import { describe, expect, it } from "vitest";
import { parseCardInput } from "./card-input";
import { CARD_SIDE_MAX } from "@/features/cards/domain/card-rules";

function formData(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe("parseCardInput", () => {
  it("trims and maps front/back to the repository input shape", () => {
    const { input, fieldErrors } = parseCardInput(
      formData({ front: "  What is the femur?  ", back: "  A bone.  " }),
    );

    expect(fieldErrors).toBeUndefined();
    expect(input).toEqual({ frontText: "What is the femur?", backText: "A bone." });
  });

  it("returns field errors when a side is empty", () => {
    const { input, fieldErrors } = parseCardInput(
      formData({ front: "Question?", back: "   " }),
    );

    expect(input).toBeUndefined();
    expect(fieldErrors?.back).toBeDefined();
  });

  it("returns a field error when a side exceeds the hard cap", () => {
    const { fieldErrors } = parseCardInput(
      formData({ front: "a".repeat(CARD_SIDE_MAX + 1), back: "ok" }),
    );

    expect(fieldErrors?.front).toBe(`Use at most ${CARD_SIDE_MAX} characters.`);
  });
});

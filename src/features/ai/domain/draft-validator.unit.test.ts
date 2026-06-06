import { describe, expect, it } from "vitest";
import { CARD_SIDE_MAX } from "@/features/cards/domain/card-rules";
import { validateDrafts } from "./draft-validator";

describe("validateDrafts", () => {
  it("trims both sides of a valid draft", () => {
    const result = validateDrafts(
      [{ frontText: "  What is the femur?  ", backText: "  A bone.  " }],
      10,
    );

    expect(result).toEqual([{ frontText: "What is the femur?", backText: "A bone." }]);
  });

  it("drops a draft whose side exceeds the hard cap", () => {
    const result = validateDrafts(
      [
        { frontText: "a".repeat(CARD_SIDE_MAX + 1), backText: "ok" },
        { frontText: "What is the femur?", backText: "A bone." },
      ],
      10,
    );

    expect(result).toHaveLength(1);
    expect(result[0].frontText).toBe("What is the femur?");
  });

  it("drops a draft with an empty side", () => {
    const result = validateDrafts(
      [
        { frontText: "What is the femur?", backText: "   " },
        { frontText: "What is the tibia?", backText: "A shin bone." },
      ],
      10,
    );

    expect(result).toHaveLength(1);
    expect(result[0].frontText).toBe("What is the tibia?");
  });

  it("caps the result to maxDrafts", () => {
    const drafts = Array.from({ length: 12 }, (_, i) => ({
      frontText: `Question ${i}?`,
      backText: `Answer ${i}.`,
    }));

    expect(validateDrafts(drafts, 10)).toHaveLength(10);
  });
});

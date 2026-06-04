import { describe, expect, it } from "vitest";
import {
  CARD_SIDE_MAX,
  CARD_SIDE_RECOMMENDED,
  validateCard,
} from "./card-rules";

describe("validateCard errors", () => {
  it("accepts a short, question-first card with no errors", () => {
    const { errors } = validateCard({
      front: "What is the largest bone in the human body?",
      back: "The femur.",
    });

    expect(errors).toEqual({});
  });

  it("requires both sides", () => {
    const { errors } = validateCard({ front: "   ", back: "" });

    expect(errors.front).toBeDefined();
    expect(errors.back).toBeDefined();
  });

  it("rejects a side over the hard cap", () => {
    const { errors } = validateCard({
      front: "a".repeat(CARD_SIDE_MAX + 1),
      back: "ok",
    });

    expect(errors.front).toBe(`Use at most ${CARD_SIDE_MAX} characters.`);
  });

  it("accepts a side exactly at the hard cap", () => {
    const { errors } = validateCard({
      front: `${"a".repeat(CARD_SIDE_MAX - 1)}?`,
      back: "ok",
    });

    expect(errors.front).toBeUndefined();
  });
});

describe("validateCard hints (non-blocking)", () => {
  it("hints when a side exceeds the recommended length", () => {
    const { errors, hints } = validateCard({
      front: `${"a".repeat(CARD_SIDE_RECOMMENDED + 1)}?`,
      back: "ok",
    });

    expect(errors).toEqual({});
    expect(hints.some((hint) => hint.includes("Shorter cards"))).toBe(true);
  });

  it("hints when the front is not phrased as a question", () => {
    const { hints } = validateCard({ front: "The femur", back: "ok" });

    expect(hints.some((hint) => hint.includes("question"))).toBe(true);
  });

  it("hints toward a single concept when the front looks compound", () => {
    const { hints } = validateCard({
      front: "Name the femur and the tibia?",
      back: "ok",
    });

    expect(hints.some((hint) => hint.includes("single concept"))).toBe(true);
  });
});

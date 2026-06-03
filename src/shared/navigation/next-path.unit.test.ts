import { describe, expect, it } from "vitest";
import { getSafeNextPath } from "./next-path";

describe("getSafeNextPath", () => {
  it("returns a valid relative path unchanged", () => {
    expect(getSafeNextPath("/decks/123")).toBe("/decks/123");
  });

  it("defaults to /decks for empty or non-string values", () => {
    expect(getSafeNextPath(null)).toBe("/decks");
    expect(getSafeNextPath("")).toBe("/decks");
  });

  it("rejects paths that do not start with a single slash", () => {
    expect(getSafeNextPath("decks")).toBe("/decks");
    expect(getSafeNextPath("https://evil.com")).toBe("/decks");
  });

  it("rejects protocol-relative URLs to prevent open redirects", () => {
    expect(getSafeNextPath("//evil.com")).toBe("/decks");
  });
});

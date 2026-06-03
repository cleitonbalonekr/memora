import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  isValidPassword,
  validatePassword,
} from "./password-policy";

describe("validatePassword", () => {
  it("accepts a password meeting every rule", () => {
    expect(validatePassword("Password1")).toEqual([]);
    expect(isValidPassword("Password1")).toBe(true);
  });

  it("flags a password shorter than the minimum length", () => {
    expect(validatePassword("Pw1")).toContain(
      `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
    );
  });

  it("flags missing character classes", () => {
    expect(validatePassword("password1")).toContain(
      "Add at least one uppercase letter.",
    );
    expect(validatePassword("PASSWORD1")).toContain(
      "Add at least one lowercase letter.",
    );
    expect(validatePassword("Passwords")).toContain("Add at least one number.");
  });

  it("reports every failing rule at once", () => {
    expect(validatePassword("pw")).toHaveLength(3);
    expect(isValidPassword("pw")).toBe(false);
  });
});

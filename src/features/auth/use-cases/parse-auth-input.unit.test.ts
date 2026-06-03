import { describe, expect, it } from "vitest";
import { parseLogInInput, parseSignUpInput } from "./parse-auth-input";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

describe("parseSignUpInput", () => {
  it("normalizes the email and returns parsed input when valid", () => {
    const result = parseSignUpInput(
      formData({ email: "  Student@Example.com ", password: "Password1" }),
    );

    expect(result.fieldErrors).toBeUndefined();
    expect(result.input).toEqual({
      email: "student@example.com",
      password: "Password1",
    });
  });

  it("rejects an invalid email", () => {
    const result = parseSignUpInput(
      formData({ email: "not-an-email", password: "Password1" }),
    );

    expect(result.input).toBeUndefined();
    expect(result.fieldErrors?.email).toBe("Use a valid email address.");
  });

  it("surfaces password policy failures joined into one message", () => {
    const result = parseSignUpInput(
      formData({ email: "student@example.com", password: "weak" }),
    );

    expect(result.input).toBeUndefined();
    expect(result.fieldErrors?.password).toContain("Use at least 8 characters.");
  });
});

describe("parseLogInInput", () => {
  it("returns parsed input for a valid email and any non-empty password", () => {
    const result = parseLogInInput(
      formData({ email: "student@example.com", password: "anything" }),
    );

    expect(result.fieldErrors).toBeUndefined();
    expect(result.input).toEqual({
      email: "student@example.com",
      password: "anything",
    });
  });

  it("requires a password but does not enforce the signup policy", () => {
    const empty = parseLogInInput(formData({ email: "student@example.com", password: "" }));
    expect(empty.fieldErrors?.password).toBe("Enter your password.");

    const weakButPresent = parseLogInInput(
      formData({ email: "student@example.com", password: "x" }),
    );
    expect(weakButPresent.fieldErrors).toBeUndefined();
  });
});

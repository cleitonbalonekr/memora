import { describe, expect, it } from "vitest";
import { mapAuthError } from "./auth-errors";

describe("mapAuthError", () => {
  it("maps invalid-credential errors to a generic incorrect message", () => {
    expect(mapAuthError(new Error("Invalid login credentials"))).toBe(
      "Email or password is incorrect.",
    );
  });

  it("maps already-registered errors", () => {
    expect(mapAuthError(new Error("User already registered"))).toBe(
      "An account with that email already exists.",
    );
  });

  it("maps password and email problems to their own messages", () => {
    expect(mapAuthError(new Error("Password should be stronger"))).toBe(
      "The password does not meet the account security requirements.",
    );
    expect(mapAuthError(new Error("Unable to validate email address"))).toBe(
      "Use a valid email address.",
    );
  });

  it("falls back to a safe message for unknown or non-Error values", () => {
    const fallback = "We could not complete this request. Try again.";
    expect(mapAuthError(new Error("some internal db detail"))).toBe(fallback);
    expect(mapAuthError("a raw string")).toBe(fallback);
    expect(mapAuthError(undefined)).toBe(fallback);
  });
});

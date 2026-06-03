import { describe, expect, it } from "vitest";
import { registerUser } from "./register-user";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { FakeAuthGateway } from "../../../../tests/support/fake-auth-gateway";

function signUpForm(email: string, password: string): FormData {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  return fd;
}

const userRepository = new DrizzleUserRepository();

describe("registerUser", () => {
  it("signs up, persists a profile, and returns success", async () => {
    const id = crypto.randomUUID();
    const auth = new FakeAuthGateway({
      signUpResult: { id, email: "new@example.com" },
    });

    const result = await registerUser(
      signUpForm("new@example.com", "Password1"),
      auth,
      userRepository,
    );

    expect(result).toEqual({
      status: "success",
      userId: id,
      email: "new@example.com",
    });
    expect(auth.calls.signUp).toHaveLength(1);

    const profile = await userRepository.findProfileById(id);
    expect(profile?.email).toBe("new@example.com");
  });

  it("persists the profile but returns check_email when confirmation is required", async () => {
    const id = crypto.randomUUID();
    const auth = new FakeAuthGateway({
      signUpResult: {
        id,
        email: "confirm@example.com",
        needsEmailConfirmation: true,
      },
    });

    const result = await registerUser(
      signUpForm("confirm@example.com", "Password1"),
      auth,
      userRepository,
    );

    expect(result).toEqual({ status: "check_email", email: "confirm@example.com" });
    expect(await userRepository.findProfileById(id)).not.toBeNull();
  });

  it("rejects invalid input before calling the auth provider", async () => {
    const auth = new FakeAuthGateway();

    const result = await registerUser(
      signUpForm("bad-email", "weak"),
      auth,
      userRepository,
    );

    expect(result.status).toBe("invalid_input");
    expect(auth.calls.signUp).toHaveLength(0);
  });

  it("maps provider failures to a safe provider_error message", async () => {
    const auth = new FakeAuthGateway({
      signUpError: new Error("User already registered"),
    });

    const result = await registerUser(
      signUpForm("dupe@example.com", "Password1"),
      auth,
      userRepository,
    );

    expect(result).toEqual({
      status: "provider_error",
      message: "An account with that email already exists.",
    });
  });
});

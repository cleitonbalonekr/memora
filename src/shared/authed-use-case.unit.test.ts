import { describe, expect, it } from "vitest";
import { AuthedUseCase } from "./authed-use-case";
import { SessionUser } from "@/ports/auth-gateway";
import { FakeAuthGateway } from "../../tests/support/fake-auth-gateway";

const currentUser: SessionUser = { id: "user-1", email: "owner@example.com" };

class CapturingUseCase extends AuthedUseCase<string, { user: SessionUser; input: string }> {
  protected async handle(user: SessionUser, input: string) {
    return { user, input };
  }
}

class MappingUseCase extends AuthedUseCase<void, string> {
  protected async handle(): Promise<string> {
    throw new Error("boom");
  }

  protected mapError(): string {
    return "mapped";
  }
}

class RethrowingUseCase extends AuthedUseCase<void, string> {
  protected async handle(): Promise<string> {
    throw new Error("boom");
  }
}

describe("AuthedUseCase", () => {
  it("resolves the current user and passes it to handle with the input", async () => {
    const auth = new FakeAuthGateway({ currentUser });
    const result = await new CapturingUseCase(auth).execute("payload");

    expect(result.user).toEqual(currentUser);
    expect(result.input).toBe("payload");
  });

  it("routes a thrown error through an overridden mapError", async () => {
    const auth = new FakeAuthGateway({ currentUser });

    expect(await new MappingUseCase(auth).execute()).toBe("mapped");
  });

  it("rethrows by default when handle throws", async () => {
    const auth = new FakeAuthGateway({ currentUser });

    await expect(new RethrowingUseCase(auth).execute()).rejects.toThrow("boom");
  });

  it("throws Unauthorized before handle runs when there is no current user", async () => {
    const auth = new FakeAuthGateway({ currentUser: null });

    await expect(new CapturingUseCase(auth).execute("payload")).rejects.toThrow(
      "Unauthorized",
    );
  });
});

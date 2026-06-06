import { AuthGateway } from "@/ports/auth-gateway";
import { UserRepository } from "@/ports/user-repository";
import { UseCase } from "@/shared/use-case";
import { AuthUseCaseResult, mapAuthError } from "./auth-errors";
import { parseLogInInput } from "./parse-auth-input";

// Establishes a session, so it extends the plain UseCase base (no current user
// exists yet) and runs without resolving one.
export class LoginUser extends UseCase<FormData, AuthUseCaseResult> {
  constructor(
    private readonly auth: AuthGateway,
    private readonly users: UserRepository,
  ) {
    super();
  }

  async execute(formData: FormData): Promise<AuthUseCaseResult> {
    const parsed = parseLogInInput(formData);

    if (!parsed.input) {
      return {
        status: "invalid_input",
        fieldErrors: parsed.fieldErrors ?? {},
        message: "Check the highlighted fields.",
      };
    }

    try {
      const user = await this.auth.signIn(parsed.input.email, parsed.input.password);
      await this.users.ensureProfile({
        id: user.id,
        email: user.email,
      });

      return {
        status: "success",
        userId: user.id,
        email: user.email,
      };
    } catch (error) {
      return {
        status: "provider_error",
        message: mapAuthError(error),
      };
    }
  }
}

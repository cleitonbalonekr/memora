import { AuthGateway } from "@/ports/auth-gateway";
import { UserRepository } from "@/ports/user-repository";
import { AuthUseCaseResult, mapAuthError } from "./auth-errors";
import { parseLogInInput } from "./parse-auth-input";

export async function loginUser(
  formData: FormData,
  authGateway: AuthGateway,
  userRepository: UserRepository
): Promise<AuthUseCaseResult> {
  const parsed = parseLogInInput(formData);

  if (!parsed.input) {
    return {
      status: "invalid_input",
      fieldErrors: parsed.fieldErrors ?? {},
      message: "Check the highlighted fields.",
    };
  }

  try {
    const user = await authGateway.signIn(parsed.input.email, parsed.input.password);
    await userRepository.ensureProfile({
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

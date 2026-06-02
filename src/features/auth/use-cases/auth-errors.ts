export type AuthUseCaseResult =
  | { status: "success"; userId: string; email: string }
  | { status: "check_email"; email: string }
  | { status: "invalid_input"; fieldErrors: Record<string, string>; message: string }
  | { status: "provider_error"; message: string };

export function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("invalid login") || message.includes("invalid credentials")) {
    return "Email or password is incorrect.";
  }

  if (message.includes("already registered") || message.includes("already exists")) {
    return "An account with that email already exists.";
  }

  if (message.includes("password")) {
    return "The password does not meet the account security requirements.";
  }

  if (message.includes("email")) {
    return "Use a valid email address.";
  }

  return "We could not complete this request. Try again.";
}

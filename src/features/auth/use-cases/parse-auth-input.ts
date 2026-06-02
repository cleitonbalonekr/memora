import { validatePassword } from "@/features/auth/domain/password-policy";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SignUpInput {
  email: string;
  password: string;
}

export interface LogInInput {
  email: string;
  password: string;
}

export function parseSignUpInput(formData: FormData): {
  input?: SignUpInput;
  fieldErrors?: Record<string, string>;
} {
  const email = normalizeEmail(formData.get("email"));
  const password = readString(formData.get("password"));
  const fieldErrors: Record<string, string> = {};

  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Use a valid email address.";
  }

  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    fieldErrors.password = passwordErrors.join(" ");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    input: {
      email,
      password,
    },
  };
}

export function parseLogInInput(formData: FormData): {
  input?: LogInInput;
  fieldErrors?: Record<string, string>;
} {
  const email = normalizeEmail(formData.get("email"));
  const password = readString(formData.get("password"));
  const fieldErrors: Record<string, string> = {};

  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Use a valid email address.";
  }

  if (password.length === 0) {
    fieldErrors.password = "Enter your password.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    input: {
      email,
      password,
    },
  };
}

function normalizeEmail(value: FormDataEntryValue | null): string {
  return readString(value).trim().toLowerCase();
}

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

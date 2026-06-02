export const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Use at least ${PASSWORD_MIN_LENGTH} characters.`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Add at least one uppercase letter.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Add at least one lowercase letter.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Add at least one number.");
  }

  return errors;
}

export function isValidPassword(password: string): boolean {
  return validatePassword(password).length === 0;
}

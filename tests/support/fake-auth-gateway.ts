import { AuthGateway, SessionUser } from "@/ports/auth-gateway";

export interface FakeAuthGatewayOptions {
  /** User returned by getCurrentUser(). Defaults to null (signed out). */
  currentUser?: SessionUser | null;
  /** Overrides the SessionUser returned by signUp(). */
  signUpResult?: SessionUser;
  /** When set, signUp() rejects with this error (simulates a provider error). */
  signUpError?: Error;
  /** Overrides the SessionUser returned by signIn(). */
  signInResult?: SessionUser;
  /** When set, signIn() rejects with this error. */
  signInError?: Error;
}

/**
 * In-memory AuthGateway test double. Lets use-case tests drive auth outcomes
 * (success, email-confirmation, provider errors) without touching Supabase, and
 * records calls for assertions.
 */
export class FakeAuthGateway implements AuthGateway {
  readonly calls = {
    signUp: [] as Array<{ email: string; password: string }>,
    signIn: [] as Array<{ email: string; password: string }>,
    signOut: 0,
    getCurrentUser: 0,
  };

  constructor(private readonly options: FakeAuthGatewayOptions = {}) {}

  async signUp(email: string, password: string): Promise<SessionUser> {
    this.calls.signUp.push({ email, password });
    if (this.options.signUpError) {
      throw this.options.signUpError;
    }
    return this.options.signUpResult ?? { id: deterministicId(email), email };
  }

  async signIn(email: string, password: string): Promise<SessionUser> {
    this.calls.signIn.push({ email, password });
    if (this.options.signInError) {
      throw this.options.signInError;
    }
    return this.options.signInResult ?? { id: deterministicId(email), email };
  }

  async signOut(): Promise<void> {
    this.calls.signOut += 1;
  }

  async getCurrentUser(): Promise<SessionUser | null> {
    this.calls.getCurrentUser += 1;
    return this.options.currentUser ?? null;
  }
}

// Stable UUID derived from the email so the same user maps to the same id within
// a test (e.g. signUp then a deck owned by that user).
function deterministicId(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i += 1) {
    hash = (hash * 31 + email.charCodeAt(i)) >>> 0;
  }
  const hex = hash.toString(16).padStart(8, "0");
  return `${hex}-0000-4000-8000-000000000000`;
}

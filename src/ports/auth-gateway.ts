export interface SessionUser {
  id: string;
  email: string;
  needsEmailConfirmation?: boolean;
}

export interface AuthGateway {
  signUp(email: string, password: string): Promise<SessionUser>;
  signIn(email: string, password: string): Promise<SessionUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<SessionUser | null>;
}

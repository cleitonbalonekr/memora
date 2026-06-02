import { AuthGateway, SessionUser } from "@/ports/auth-gateway";

export async function requireCurrentUser(authGateway: AuthGateway): Promise<SessionUser> {
  const user = await authGateway.getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

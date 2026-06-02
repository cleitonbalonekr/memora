import { AuthGateway } from "@/ports/auth-gateway";

export async function logoutUser(authGateway: AuthGateway): Promise<void> {
  await authGateway.signOut();
}

import { AuthGateway } from "@/ports/auth-gateway";
import { UseCase } from "@/shared/use-case";

// Ends the session. No current user is resolved, so it extends the plain
// UseCase base.
export class LogoutUser extends UseCase<void, void> {
  constructor(private readonly auth: AuthGateway) {
    super();
  }

  async execute(): Promise<void> {
    await this.auth.signOut();
  }
}

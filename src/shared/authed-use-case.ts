import { AuthGateway, SessionUser } from "@/ports/auth-gateway";
import { requireCurrentUser } from "@/features/auth/use-cases/require-current-user";
import { UseCase } from "./use-case";

// Base for every use case that acts on behalf of a signed-in user. The shared
// lifecycle lives here once: resolve the current user, run `handle`, and route
// any thrown error through `mapError`. Concrete use cases implement only
// `handle` (and override `mapError` where they map failures to a result union).
export abstract class AuthedUseCase<I, O> extends UseCase<I, O> {
  constructor(protected readonly auth: AuthGateway) {
    super();
  }

  async execute(input: I): Promise<O> {
    // Identity is resolved server-side from the signed, httpOnly session cookie
    // and never taken from client-supplied input (D7, ADR-006, SOC2 least
    // privilege). Resolution sits outside the try/catch so an unauthorized
    // caller surfaces as a thrown error rather than a mapped result.
    const user = await requireCurrentUser(this.auth);

    try {
      return await this.handle(user, input);
    } catch (error) {
      return this.mapError(error);
    }
  }

  protected abstract handle(user: SessionUser, input: I): Promise<O>;

  // Default: rethrow, so read use cases let errors propagate. Command use cases
  // override this to map known failures to their result union.
  protected mapError(error: unknown): O {
    throw error;
  }
}

import { Deck } from "@/ports/deck-repository";

export type DeckUseCaseResult =
  | { status: "success"; deck: Deck }
  | { status: "invalid_input"; fieldErrors: Record<string, string>; message: string }
  | { status: "not_found" }
  | { status: "provider_error"; message: string };

export type DeckDeletionResult =
  | { status: "success" }
  | { status: "not_found" }
  | { status: "provider_error"; message: string };

// The Drizzle repositories throw this message when a row is missing or owned by
// another user. Both cases map to "not_found" so callers never reveal whether a
// deck exists for a different user (SOC2 least privilege).
const NOT_FOUND_PATTERN = /not found or unauthorized/i;

export function isDeckNotFoundError(error: unknown): boolean {
  return error instanceof Error && NOT_FOUND_PATTERN.test(error.message);
}

export function mapDeckError(error: unknown): DeckUseCaseResult {
  if (isDeckNotFoundError(error)) {
    return { status: "not_found" };
  }

  return {
    status: "provider_error",
    message: "We could not complete this request. Try again.",
  };
}

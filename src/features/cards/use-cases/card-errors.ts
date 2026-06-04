import { Card } from "@/ports/card-repository";

export type CardUseCaseResult =
  | { status: "success"; card: Card }
  | { status: "invalid_input"; fieldErrors: Record<string, string>; message: string }
  | { status: "not_found" }
  | { status: "provider_error"; message: string };

export type CardDeletionResult =
  | { status: "success" }
  | { status: "not_found" }
  | { status: "provider_error"; message: string };

// The Drizzle card repository throws this message both when the card is missing
// or owned by another user and when the target deck is not owned. All of these
// map to "not_found" so callers never reveal another user's data.
const NOT_FOUND_PATTERN = /not found or unauthorized/i;

export function isCardNotFoundError(error: unknown): boolean {
  return error instanceof Error && NOT_FOUND_PATTERN.test(error.message);
}

export function mapCardError(error: unknown): CardUseCaseResult {
  if (isCardNotFoundError(error)) {
    return { status: "not_found" };
  }

  return {
    status: "provider_error",
    message: "We could not complete this request. Try again.",
  };
}

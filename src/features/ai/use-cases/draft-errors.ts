import { CardDraft } from "@/ports/ai-card-generator";

// Typed results for the AI use cases, following the existing discriminated-union
// pattern (cards/use-cases/card-errors). Known failures map to safe messages at
// the boundary; raw provider/model errors never reach the client (ADR-006).

export type GenerateDraftsResult =
  | { status: "success"; drafts: CardDraft[] }
  | { status: "invalid_input"; message: string }
  | { status: "not_found" }
  | { status: "rate_limited"; retryAfterSeconds?: number; message: string }
  | { status: "provider_error"; message: string };

export type SaveDraftsResult =
  | { status: "success"; savedCount: number }
  | { status: "invalid_input"; message: string }
  | { status: "not_found" }
  | { status: "provider_error"; message: string };

// The repositories throw this message when a deck/card is missing or owned by
// another user; all map to "not_found" so callers never reveal another user's
// data (mirrors card-errors).
const NOT_FOUND_PATTERN = /not found or unauthorized/i;

export function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && NOT_FOUND_PATTERN.test(error.message);
}

// Maps an error thrown during generation to a safe result. A not-found deck is
// distinguished from a provider failure; everything else is a generic provider
// error (the underlying detail is logged in the adapter, not surfaced here).
export function mapGenerateError(error: unknown): GenerateDraftsResult {
  if (isNotFoundError(error)) {
    return { status: "not_found" };
  }

  return {
    status: "provider_error",
    message: "We could not generate cards right now. Try again.",
  };
}

export function mapSaveError(error: unknown): SaveDraftsResult {
  if (isNotFoundError(error)) {
    return { status: "not_found" };
  }

  return {
    status: "provider_error",
    message: "We could not save these cards. Try again.",
  };
}

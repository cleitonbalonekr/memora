"use server";

import { z } from "zod";
import { getReviewCard } from "@/composition-root";

// The card id and grade are the only client-supplied values; the acting user is
// resolved server-side inside the use case (never trusted from the client), and
// ownership is enforced in the repository. Validate the shape at the boundary
// (ADR-006) before invoking the use case.
const reviewSchema = z.object({
  cardId: z.string().uuid(),
  grade: z.enum(["again", "hard", "good", "easy"]),
});

export type ReviewCardActionResult =
  | { status: "success" }
  | { status: "error"; message: string };

export async function reviewCardAction(
  input: unknown,
): Promise<ReviewCardActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Invalid review." };
  }

  const result = await getReviewCard().execute(parsed.data);

  switch (result.status) {
    case "success":
      return { status: "success" };
    case "not_found":
      return { status: "error", message: "We could not find that card." };
    case "provider_error":
      return { status: "error", message: result.message };
  }
}

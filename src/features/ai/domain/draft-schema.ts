import { z } from "zod";

export const cardDraftSchema = z.object({
  frontText: z.string(),
  backText: z.string(),
});

export type CardDraft = z.infer<typeof cardDraftSchema>;

export const draftsResponseSchema = z.object({
  drafts: z.array(cardDraftSchema).default([]),
});

export type DraftsResponse = z.infer<typeof draftsResponseSchema>;

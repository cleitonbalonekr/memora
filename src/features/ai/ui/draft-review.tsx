"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  GenerateDraftsActionResult,
  SaveDraftsActionResult,
} from "@/app/(app)/decks/[deckId]/generate/actions";
import type { CardDraft } from "@/ports/ai-card-generator";
import { CARD_SIDE_MAX, validateCard } from "@/features/cards/domain/card-rules";
import { TextAreaField } from "@/shared/ui/text-area-field";

interface DraftReviewProps {
  deckId: string;
  deckTitle: string;
  generateAction: (topicOrNotes: string) => Promise<GenerateDraftsActionResult>;
  saveAction: (drafts: CardDraft[]) => Promise<SaveDraftsActionResult>;
}

interface EditableDraft {
  id: number;
  frontText: string;
  backText: string;
  selected: boolean;
}

export function DraftReview({
  deckId,
  deckTitle,
  generateAction,
  saveAction,
}: DraftReviewProps) {
  const router = useRouter();
  const [topicOrNotes, setTopicOrNotes] = useState("");
  const [drafts, setDrafts] = useState<EditableDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  function generate() {
    setError(null);
    startGenerating(async () => {
      const result = await generateAction(topicOrNotes);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      if (result.drafts.length === 0) {
        setDrafts([]);
        setError("No drafts generated. Try a more specific topic or add notes.");
        return;
      }
      setDrafts(
        result.drafts.map((draft, index) => ({
          id: index,
          frontText: draft.frontText,
          backText: draft.backText,
          selected: true,
        })),
      );
    });
  }

  function updateDraft(id: number, patch: Partial<EditableDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)),
    );
  }

  const selected = drafts.filter((draft) => draft.selected);
  const hasInvalidSelection = selected.some(
    (draft) =>
      Object.keys(
        validateCard({ front: draft.frontText, back: draft.backText }).errors,
      ).length > 0,
  );
  const canSave = selected.length > 0 && !hasInvalidSelection && !isSaving;

  function save() {
    setError(null);
    startSaving(async () => {
      const result = await saveAction(
        selected.map((draft) => ({
          frontText: draft.frontText,
          backText: draft.backText,
        })),
      );
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      router.push(`/decks/${deckId}`);
      router.refresh();
    });
  }

  return (
    <div className="flex w-full flex-col gap-lg">
      <section className="flex flex-col gap-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md shadow-level1">
        <TextAreaField
          id="topic"
          label="Topic or notes"
          maxLength={5000}
          onChange={(event) => setTopicOrNotes(event.target.value)}
          placeholder="Paste notes or enter a topic, e.g. 'The phases of mitosis'."
          value={topicOrNotes}
        />
        <button
          className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-md text-headline-sm text-on-primary shadow-level1 transition hover:bg-surface-tint disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isGenerating || topicOrNotes.trim().length === 0}
          onClick={generate}
          type="button"
        >
          {isGenerating ? "Generating..." : "Generate drafts"}
        </button>
        {error ? <p className="text-label-md text-error">{error}</p> : null}
      </section>

      {drafts.length > 0 ? (
        <section className="flex flex-col gap-md">
          <h2 className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Review drafts ({selected.length} selected)
          </h2>
          <ul className="flex flex-col gap-md">
            {drafts.map((draft) => {
              const { errors } = validateCard({
                front: draft.frontText,
                back: draft.backText,
              });
              return (
                <li
                  className="flex flex-col gap-sm rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md shadow-level1"
                  key={draft.id}
                >
                  <label className="flex items-center gap-sm text-label-md text-on-surface">
                    <input
                      checked={draft.selected}
                      onChange={(event) =>
                        updateDraft(draft.id, { selected: event.target.checked })
                      }
                      type="checkbox"
                    />
                    Keep this card
                  </label>
                  <TextAreaField
                    error={draft.selected ? errors.front : undefined}
                    id={`front-${draft.id}`}
                    label="Front (question)"
                    maxLength={CARD_SIDE_MAX}
                    onChange={(event) =>
                      updateDraft(draft.id, { frontText: event.target.value })
                    }
                    value={draft.frontText}
                  />
                  <TextAreaField
                    error={draft.selected ? errors.back : undefined}
                    id={`back-${draft.id}`}
                    label="Back (answer)"
                    maxLength={CARD_SIDE_MAX}
                    onChange={(event) =>
                      updateDraft(draft.id, { backText: event.target.value })
                    }
                    value={draft.backText}
                  />
                </li>
              );
            })}
          </ul>
          <button
            className="flex h-14 w-full items-center justify-center rounded-xl bg-secondary px-md text-headline-sm text-on-secondary shadow-level1 transition hover:bg-secondary-fixed disabled:cursor-not-allowed disabled:opacity-70"
            disabled={!canSave}
            onClick={save}
            type="button"
          >
            {isSaving ? "Saving..." : `Save ${selected.length} card${selected.length === 1 ? "" : "s"}`}
          </button>
          <Link
            className="text-center text-label-md text-primary hover:underline"
            href={`/decks/${deckId}`}
          >
            Cancel and back to {deckTitle}
          </Link>
        </section>
      ) : null}
    </div>
  );
}

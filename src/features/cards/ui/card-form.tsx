"use client";

import { useActionState, useState } from "react";
import { FormState, initialFormState } from "@/shared/actions/form-state";
import { TextAreaField } from "@/shared/ui/text-area-field";
import { CARD_SIDE_MAX, validateCard } from "@/features/cards/domain/card-rules";
import { CardGuidance } from "./card-guidance";

interface CardFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel: string;
  defaultValues?: { front?: string; back?: string };
}

export function CardForm({
  action,
  submitLabel,
  pendingLabel,
  defaultValues,
}: CardFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialFormState);
  const [front, setFront] = useState(defaultValues?.front ?? "");
  const [back, setBack] = useState(defaultValues?.back ?? "");

  // Live, non-blocking guidance toward short, single-concept, question-first cards.
  const { hints } = validateCard({ front, back });

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md shadow-level1"
    >
      <TextAreaField
        error={state.fieldErrors?.front}
        id="front"
        label="Front (question)"
        maxLength={CARD_SIDE_MAX}
        name="front"
        onChange={(event) => setFront(event.target.value)}
        placeholder="What is the largest bone in the human body?"
        required
        value={front}
      />
      <TextAreaField
        error={state.fieldErrors?.back}
        id="back"
        label="Back (answer)"
        maxLength={CARD_SIDE_MAX}
        name="back"
        onChange={(event) => setBack(event.target.value)}
        placeholder="The femur (thigh bone)."
        required
        value={back}
      />
      <CardGuidance hints={hints} />
      {state.message ? (
        <p className="text-label-md text-error">{state.message}</p>
      ) : null}
      <button
        className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-md text-headline-sm text-on-primary shadow-level1 transition hover:bg-surface-tint disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

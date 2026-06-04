"use client";

import { useActionState } from "react";
import { FormState, initialFormState } from "@/shared/actions/form-state";
import { FormField } from "@/shared/ui/form-field";
import {
  DECK_DESCRIPTION_MAX,
  DECK_TITLE_MAX,
} from "@/features/decks/use-cases/deck-input";

interface DeckFormProps {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel: string;
  defaultValues?: { title?: string; description?: string };
}

export function DeckForm({
  action,
  submitLabel,
  pendingLabel,
  defaultValues,
}: DeckFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialFormState);

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md shadow-level1"
    >
      <FormField
        autoComplete="off"
        defaultValue={defaultValues?.title}
        error={state.fieldErrors?.title}
        id="title"
        label="Title"
        maxLength={DECK_TITLE_MAX}
        name="title"
        placeholder="Anatomy 101"
        required
      />
      <div className="flex flex-col gap-xs">
        <label className="text-label-sm text-on-surface" htmlFor="description">
          Description (optional)
        </label>
        <textarea
          aria-describedby={
            state.fieldErrors?.description ? "description-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.description)}
          className="min-h-24 w-full rounded-lg border border-outline-variant bg-surface px-sm py-sm text-body-md text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          defaultValue={defaultValues?.description}
          id="description"
          maxLength={DECK_DESCRIPTION_MAX}
          name="description"
          placeholder="What is this deck about?"
        />
        {state.fieldErrors?.description ? (
          <p className="text-label-sm text-error" id="description-error">
            {state.fieldErrors.description}
          </p>
        ) : null}
      </div>
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

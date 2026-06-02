"use client";

import { useActionState } from "react";
import { logInAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/shared/actions/form-state";
import { FormField } from "./form-field";

interface LogInFormProps {
  nextPath: string;
}

export function LogInForm({ nextPath }: LogInFormProps) {
  const [state, action, isPending] = useActionState(logInAction, initialFormState);

  return (
    <form action={action} className="flex w-full flex-col gap-md rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-md shadow-level1">
      <input name="next" type="hidden" value={nextPath} />
      <FormField
        autoComplete="email"
        error={state.fieldErrors?.email}
        id="email"
        label="Email"
        name="email"
        placeholder="student@example.com"
        required
        type="email"
      />
      <FormField
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        id="password"
        label="Password"
        name="password"
        placeholder="Your password"
        required
        type="password"
      />
      {state.message ? <p className="text-label-md text-error">{state.message}</p> : null}
      <button
        className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-md text-headline-sm text-on-primary shadow-level1 transition hover:bg-surface-tint disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}

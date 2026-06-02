"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/(auth)/actions";
import { initialFormState } from "@/shared/actions/form-state";
import { FormField } from "./form-field";

interface SignUpFormProps {
  nextPath: string;
}

export function SignUpForm({ nextPath }: SignUpFormProps) {
  const [state, action, isPending] = useActionState(signUpAction, initialFormState);

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
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        id="password"
        label="Password"
        name="password"
        placeholder="At least 8 characters"
        required
        type="password"
      />
      <p className="text-label-sm text-on-surface-variant">
        Use 8+ characters with uppercase, lowercase, and a number.
      </p>
      {state.message ? (
        <p className={state.status === "success" ? "text-label-md text-secondary" : "text-label-md text-error"}>
          {state.message}
        </p>
      ) : null}
      <button
        className="flex h-14 w-full items-center justify-center rounded-xl bg-primary px-md text-headline-sm text-on-primary shadow-level1 transition hover:bg-surface-tint disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>
      <p className="text-center text-label-sm text-on-surface-variant">
        By creating an account, you agree to use Memora for your own study data.
      </p>
      <Link className="sr-only" href="/log-in">
        Log in
      </Link>
    </form>
  );
}

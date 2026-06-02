"use server";

import { redirect } from "next/navigation";
import { SupabaseAuthGateway } from "@/adapters/auth/supabase-auth-gateway";
import { DrizzleUserRepository } from "@/adapters/db/drizzle-user-repository";
import { loginUser } from "@/features/auth/use-cases/login-user";
import { logoutUser } from "@/features/auth/use-cases/logout-user";
import { registerUser } from "@/features/auth/use-cases/register-user";
import { FormState } from "@/shared/actions/form-state";
import { getSafeNextPath } from "@/shared/navigation/next-path";

export async function signUpAction(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await registerUser(
    formData,
    new SupabaseAuthGateway(),
    new DrizzleUserRepository()
  );

  switch (result.status) {
    case "success":
      redirect(getSafeNextPath(formData.get("next")));
    case "check_email":
      return {
        status: "success",
        message: "Check your email to confirm your account, then log in.",
      };
    case "invalid_input":
      return {
        status: "error",
        message: result.message,
        fieldErrors: result.fieldErrors,
      };
    case "provider_error":
      return {
        status: "error",
        message: result.message,
      };
  }
}

export async function logInAction(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await loginUser(
    formData,
    new SupabaseAuthGateway(),
    new DrizzleUserRepository()
  );

  switch (result.status) {
    case "success":
      redirect(getSafeNextPath(formData.get("next")));
    case "invalid_input":
      return {
        status: "error",
        message: result.message,
        fieldErrors: result.fieldErrors,
      };
    case "provider_error":
      return {
        status: "error",
        message: result.message,
      };
    case "check_email":
      return {
        status: "error",
        message: "Confirm your email before logging in.",
      };
  }
}

export async function logOutAction(): Promise<void> {
  await logoutUser(new SupabaseAuthGateway());
  redirect("/log-in");
}

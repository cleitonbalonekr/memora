"use server";

import { redirect } from "next/navigation";
import { getLoginUser, getLogoutUser, getRegisterUser } from "@/composition-root";
import { FormState } from "@/shared/actions/form-state";
import { getSafeNextPath } from "@/shared/navigation/next-path";

export async function signUpAction(
  _state: FormState,
  formData: FormData
): Promise<FormState> {
  const result = await getRegisterUser().execute(formData);

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
  const result = await getLoginUser().execute(formData);
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
  await getLogoutUser().execute();
  redirect("/log-in");
}

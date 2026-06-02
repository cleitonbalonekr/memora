export type FieldErrors = Record<string, string>;

export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
}

export const initialFormState: FormState = {
  status: "idle",
};

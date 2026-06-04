import { validateCard } from "@/features/cards/domain/card-rules";

export interface CardInput {
  frontText: string;
  backText: string;
}

export function parseCardInput(formData: FormData): {
  input?: CardInput;
  fieldErrors?: Record<string, string>;
} {
  const front = readString(formData.get("front")).trim();
  const back = readString(formData.get("back")).trim();

  const { errors } = validateCard({ front, back });
  if (Object.keys(errors).length > 0) {
    return { fieldErrors: errors };
  }

  return {
    input: {
      frontText: front,
      backText: back,
    },
  };
}

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

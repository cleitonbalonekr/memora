export const DECK_TITLE_MAX = 80;
export const DECK_DESCRIPTION_MAX = 300;

export interface DeckInput {
  title: string;
  description?: string;
}

export function parseDeckInput(formData: FormData): {
  input?: DeckInput;
  fieldErrors?: Record<string, string>;
} {
  const title = readString(formData.get("title")).trim();
  const description = readString(formData.get("description")).trim();
  const fieldErrors: Record<string, string> = {};

  if (title.length === 0) {
    fieldErrors.title = "Enter a title for the deck.";
  } else if (title.length > DECK_TITLE_MAX) {
    fieldErrors.title = `Use at most ${DECK_TITLE_MAX} characters.`;
  }

  if (description.length > DECK_DESCRIPTION_MAX) {
    fieldErrors.description = `Use at most ${DECK_DESCRIPTION_MAX} characters.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  return {
    input: {
      title,
      description: description.length > 0 ? description : undefined,
    },
  };
}

function readString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

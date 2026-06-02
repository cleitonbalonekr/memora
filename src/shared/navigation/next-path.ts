const DEFAULT_SIGNED_IN_PATH = "/decks";

export function getSafeNextPath(value: FormDataEntryValue | string | null): string {
  if (typeof value !== "string" || value.length === 0) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  return value;
}

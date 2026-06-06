// OpenRouter + rate-limit settings, read from server-side environment only.
// The API key must never be exposed to the browser (no NEXT_PUBLIC_* prefix),
// so this module is imported only by server-side adapters (ADR-006, SOC2).

// const DEFAULT_MODEL = "arcee-ai/trinity-large-preview:free";
const DEFAULT_MODEL = "google/gemma-4-31b-it:free";


const DEFAULT_RATE_LIMIT = 5;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60;
// Free-model latency on OpenRouter can be high; bound a single call so a hung
// request surfaces as a safe "try again" rather than blocking indefinitely.
const REQUEST_TIMEOUT_MS = 60_000;

export interface AiConfig {
  apiKey: string;
  model: string;
  baseURL: string;
  httpReferer: string;
  xTitle: string;
  requestTimeoutMs: number;
}

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

// Reads and asserts the OpenRouter config. Throws at construction time (startup
// of the real adapter) if the key is missing, so misconfiguration fails fast
// instead of leaking a confusing provider error to users.
export function getAiConfig(): AiConfig {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set; AI card generation is unavailable.");
  }

  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    baseURL: "https://openrouter.ai/api/v1",
    httpReferer: process.env.OPENROUTER_HTTP_REFERER ?? "",
    xTitle: "Memora",
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
  };
}

export function getRateLimitConfig(): RateLimitConfig {
  return {
    limit: readPositiveInt(process.env.AI_RATE_LIMIT, DEFAULT_RATE_LIMIT),
    windowSeconds: readPositiveInt(
      process.env.AI_RATE_LIMIT_WINDOW_SECONDS,
      DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
    ),
  };
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

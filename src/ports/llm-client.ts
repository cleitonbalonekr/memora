import { z } from "zod";

export type LlmResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: "malformed" | "provider_unavailable" | "timeout" };

export interface LlmClient {
  generateStructured<T>(input: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<LlmResult<T>>;
}

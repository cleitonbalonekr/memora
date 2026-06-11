import { z } from "zod";
import { LlmClient, LlmResult } from "@/ports/llm-client";
import { CardDraft } from "@/features/ai/domain/draft-schema";

export interface FakeLlmClientOptions {
  drafts?: CardDraft[];
  error?: "malformed" | "provider_unavailable" | "timeout";
}

export class FakeLlmClient implements LlmClient {
  readonly calls: Array<{ system: string; user: string; temperature?: number }> = [];

  constructor(private readonly options: FakeLlmClientOptions = {}) {}

  async generateStructured<T>(input: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<LlmResult<T>> {
    this.calls.push({ system: input.system, user: input.user, temperature: input.temperature });

    if (this.options.error) {
      return { ok: false, error: this.options.error };
    }

    const data = { drafts: this.options.drafts ?? [] };
    return { ok: true, data: data as unknown as T };
  }
}

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { LlmClient, LlmResult } from "@/ports/llm-client";
import { AiConfig, getAiConfig } from "./config";

export class OpenRouterLlmClient implements LlmClient {
  constructor(private readonly config: AiConfig = getAiConfig()) {}

  async generateStructured<T>(input: {
    system: string;
    user: string;
    schema: z.ZodType<T>;
    temperature?: number;
  }): Promise<LlmResult<T>> {
    const { system, user, schema, temperature = 0.7 } = input;

    // Attempt 1: native structured output (withStructuredOutput)
    try {
      return await this.tryNative(system, user, schema, temperature);
    } catch {
      // Native not supported or threw — fall through to parse-and-validate
    }

    // Attempt 2: plain invocation + extractJson fallback
    try {
      return await this.tryFallback(system, user, schema, temperature);
    } catch (error) {
      return mapProviderError(error);
    }
  }

  private async tryNative<T>(
    system: string,
    user: string,
    schema: z.ZodType<T>,
    temperature: number,
  ): Promise<LlmResult<T>> {
    const client = this.buildClient(temperature);
    const structured = client.withStructuredOutput(
      schema as unknown as z.ZodType<Record<string, unknown>>,
    );
    const result = await structured.invoke([
      new SystemMessage(system),
      new HumanMessage(user),
    ]);

    const validation = schema.safeParse(result);
    if (validation.success) {
      return { ok: true, data: validation.data };
    }
    return this.repair(system, user, schema, result, validation.error.message);
  }

  private async tryFallback<T>(
    system: string,
    user: string,
    schema: z.ZodType<T>,
    temperature: number,
  ): Promise<LlmResult<T>> {
    const client = this.buildClient(temperature);
    const response = await client.invoke([
      new SystemMessage(system),
      new HumanMessage(user),
    ]);

    const candidate = extractJson(messageText(response));
    const validation = schema.safeParse(candidate);
    if (validation.success) {
      return { ok: true, data: validation.data };
    }
    return this.repair(system, user, schema, candidate, validation.error.message);
  }

  // Single schema-repair retry: feed the validation error back once. A second
  // failure returns malformed; a provider exception is mapped to a safe category.
  private async repair<T>(
    system: string,
    user: string,
    schema: z.ZodType<T>,
    badCandidate: unknown,
    validationError: string,
  ): Promise<LlmResult<T>> {
    const repairUser = buildRepairPrompt(user, badCandidate, validationError);
    try {
      const client = this.buildClient(0.2);
      const response = await client.invoke([
        new SystemMessage(system),
        new HumanMessage(repairUser),
      ]);
      const candidate = extractJson(messageText(response));
      const validation = schema.safeParse(candidate);
      if (validation.success) {
        return { ok: true, data: validation.data };
      }
      return { ok: false, error: "malformed" };
    } catch (error) {
      return mapProviderError(error);
    }
  }

  protected buildClient(temperature: number): ChatOpenAI {
    return new ChatOpenAI({
      apiKey: this.config.apiKey,
      model: this.config.models[0],
      temperature,
      timeout: this.config.requestTimeoutMs,
      configuration: {
        baseURL: this.config.baseURL,
        defaultHeaders: {
          "HTTP-Referer": this.config.httpReferer,
          "X-Title": this.config.xTitle,
        },
      },
      modelKwargs: {
        models: this.config.models,
        provider: { sort: this.config.providerSort },
      } as Record<string, unknown>,
    });
  }
}

function buildRepairPrompt(
  originalUser: string,
  badCandidate: unknown,
  validationError: string,
): string {
  return [
    originalUser,
    "",
    "Your previous response failed schema validation:",
    validationError,
    "",
    "Previous response:",
    JSON.stringify(badCandidate),
    "",
    "Return corrected JSON only, no prose or code fences.",
  ].join("\n");
}

// LangChain message content is a string or an array of content parts; flatten
// to text so we can locate the JSON payload.
function messageText(response: { content: unknown }): string {
  const { content } = response;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "string" ? part : isTextPart(part) ? part.text : "",
      )
      .join("");
  }
  return "";
}

function isTextPart(part: unknown): part is { text: string } {
  return (
    typeof part === "object" &&
    part !== null &&
    "text" in part &&
    typeof (part as { text: unknown }).text === "string"
  );
}

// Tolerate models that wrap JSON in prose or code fences by extracting the first
// balanced { ... } object. Returns null when nothing parses.
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function mapProviderError(error: unknown): LlmResult<never> {
  if (isTimeoutError(error)) {
    return { ok: false, error: "timeout" };
  }
  return { ok: false, error: "provider_unavailable" };
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("timeout") || msg.includes("timed out");
}

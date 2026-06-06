import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import {
  AiCardGenerator,
  CardDraft,
  GenerateDraftsInput,
} from "@/ports/ai-card-generator";
import { buildGenerationPrompt } from "@/features/ai/domain/prompt-builder";
import { AiConfig, getAiConfig } from "./config";

// OpenRouter-backed AiCardGenerator (design D2). Uses LangChain's ChatOpenAI
// pointed at OpenRouter, prompts for strict JSON, and validates the response
// with Zod. Free models vary in tool-calling support, so we parse-and-validate
// rather than rely on native structured output; a response that fails the
// schema is surfaced as a provider error and never passed downstream.

const responseSchema = z.object({
  drafts: z
    .array(
      z.object({
        frontText: z.string(),
        backText: z.string(),
      }),
    )
    .default([]),
});

export class OpenRouterCardGenerator implements AiCardGenerator {
  private readonly client: ChatOpenAI;

  constructor(config: AiConfig = getAiConfig()) {
    this.client = new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.model,
      temperature: 0.7,
      timeout: config.requestTimeoutMs,
      configuration: {
        baseURL: config.baseURL,
        defaultHeaders: {
          "HTTP-Referer": config.httpReferer,
          "X-Title": config.xTitle,
        },
      },
    });
  }

  async generateDrafts(input: GenerateDraftsInput): Promise<CardDraft[]> {
    const prompt = buildGenerationPrompt(input);
    const response = await this.client.invoke([
      new SystemMessage(prompt.system),
      new HumanMessage(prompt.user),
    ]);
    const parsed = responseSchema.safeParse(extractJson(messageText(response)));
    if (!parsed.success) {
      // Log only the category; never the prompt (may contain pasted notes/PII)
      // or the raw payload (ADR-006).
      console.error("AI draft generation returned malformed output");
      throw new Error("AI provider returned malformed output");
    }

    return parsed.data.drafts;
  }
}

// LangChain message content is a string or an array of content parts; flatten to
// text so we can locate the JSON payload.
function messageText(response: { content: unknown }): string {
  const { content } = response;
  if (typeof content === "string") {
    return content;
  }
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
  if (start === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

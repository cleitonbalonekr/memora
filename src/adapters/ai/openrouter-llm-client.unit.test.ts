import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { OpenRouterLlmClient } from "./openrouter-llm-client";
import { AiConfig } from "./config";

// Minimal stand-in for ChatOpenAI used to control responses per test.
interface FakeChatClient {
  invoke: ReturnType<typeof vi.fn>;
  withStructuredOutput: ReturnType<typeof vi.fn>;
}

class TestableLlmClient extends OpenRouterLlmClient {
  constructor(
    config: AiConfig,
    private readonly fakeClient: FakeChatClient,
  ) {
    super(config);
  }

  protected override buildClient(_temperature: number): ChatOpenAI {
    return this.fakeClient as unknown as ChatOpenAI;
  }
}

const testConfig: AiConfig = {
  apiKey: "test-key",
  models: ["model-primary:free", "model-fallback:free"],
  baseURL: "https://openrouter.ai/api/v1",
  httpReferer: "",
  xTitle: "Memora",
  requestTimeoutMs: 5000,
  providerSort: "throughput",
};

const testSchema = z.object({
  drafts: z
    .array(z.object({ frontText: z.string(), backText: z.string() }))
    .default([]),
});

const validPayload = { drafts: [{ frontText: "Q?", backText: "A." }] };

function makeClient(overrides: Partial<FakeChatClient> = {}): FakeChatClient {
  return {
    invoke: vi.fn(),
    withStructuredOutput: vi.fn().mockImplementation(() => ({
      invoke: vi.fn().mockRejectedValue(new Error("native not supported")),
    })),
    ...overrides,
  };
}

describe("OpenRouterLlmClient", () => {
  describe("parse-and-validate fallback path", () => {
    it("succeeds when plain-text response contains valid JSON", async () => {
      const fakeClient = makeClient({
        invoke: vi
          .fn()
          .mockResolvedValue({ content: `prefix ${JSON.stringify(validPayload)} suffix` }),
      });
      const client = new TestableLlmClient(testConfig, fakeClient);

      const result = await client.generateStructured({
        system: "sys",
        user: "user",
        schema: testSchema,
      });

      expect(result).toEqual({ ok: true, data: validPayload });
    });

    it("succeeds when JSON is embedded in code fences", async () => {
      const fakeClient = makeClient({
        invoke: vi.fn().mockResolvedValue({
          content: "```json\n" + JSON.stringify(validPayload) + "\n```",
        }),
      });
      const client = new TestableLlmClient(testConfig, fakeClient);

      const result = await client.generateStructured({
        system: "sys",
        user: "user",
        schema: testSchema,
      });

      expect(result).toEqual({ ok: true, data: validPayload });
    });
  });

  describe("repair retry", () => {
    it("returns success when the repair response validates", async () => {
      const invoke = vi
        .fn()
        .mockResolvedValueOnce({ content: '{"drafts": "wrong type"}' })
        .mockResolvedValueOnce({ content: JSON.stringify(validPayload) });
      const fakeClient = makeClient({ invoke });
      const client = new TestableLlmClient(testConfig, fakeClient);

      const result = await client.generateStructured({
        system: "sys",
        user: "user",
        schema: testSchema,
      });

      expect(result).toEqual({ ok: true, data: validPayload });
      expect(invoke).toHaveBeenCalledTimes(2);
    });

    it("returns malformed when both attempts fail validation", async () => {
      const invoke = vi
        .fn()
        .mockResolvedValue({ content: '{"drafts": "still wrong"}' });
      const fakeClient = makeClient({ invoke });
      const client = new TestableLlmClient(testConfig, fakeClient);

      const result = await client.generateStructured({
        system: "sys",
        user: "user",
        schema: testSchema,
      });

      expect(result).toEqual({ ok: false, error: "malformed" });
      expect(invoke).toHaveBeenCalledTimes(2);
    });

    it("returns malformed when native path also fails validation and repair exhausts", async () => {
      const nativeInvoke = vi.fn().mockResolvedValue({ drafts: "not an array" });
      const fakeClient = makeClient({
        withStructuredOutput: vi.fn().mockReturnValue({ invoke: nativeInvoke }),
        invoke: vi.fn().mockResolvedValue({ content: '{"drafts": "also wrong"}' }),
      });
      const client = new TestableLlmClient(testConfig, fakeClient);

      const result = await client.generateStructured({
        system: "sys",
        user: "user",
        schema: testSchema,
      });

      expect(result).toEqual({ ok: false, error: "malformed" });
    });
  });

  describe("provider error mapping", () => {
    it("returns provider_unavailable on a generic provider error", async () => {
      const fakeClient = makeClient({
        invoke: vi.fn().mockRejectedValue(new Error("provider is down")),
      });
      const client = new TestableLlmClient(testConfig, fakeClient);

      const result = await client.generateStructured({
        system: "sys",
        user: "user",
        schema: testSchema,
      });

      expect(result).toEqual({ ok: false, error: "provider_unavailable" });
    });

    it("returns timeout when the error message indicates a timeout", async () => {
      const fakeClient = makeClient({
        invoke: vi.fn().mockRejectedValue(new Error("Request timed out after 60s")),
      });
      const client = new TestableLlmClient(testConfig, fakeClient);

      const result = await client.generateStructured({
        system: "sys",
        user: "user",
        schema: testSchema,
      });

      expect(result).toEqual({ ok: false, error: "timeout" });
    });
  });
});

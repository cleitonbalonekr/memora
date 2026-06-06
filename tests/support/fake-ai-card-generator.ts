import {
  AiCardGenerator,
  CardDraft,
  GenerateDraftsInput,
} from "@/ports/ai-card-generator";

export interface FakeAiCardGeneratorOptions {
  /** Drafts returned by generateDrafts(). Ignored when `error` is set. */
  drafts?: CardDraft[];
  /** When set, generateDrafts() rejects with this error (simulates the adapter
   * throwing a provider error, e.g. malformed model output). */
  error?: Error;
}

// In-memory AiCardGenerator test double. Lets use-case tests drive generation
// outcomes (canned drafts, provider error) without a network call, and records
// inputs for assertions.
export class FakeAiCardGenerator implements AiCardGenerator {
  readonly calls: GenerateDraftsInput[] = [];

  constructor(private readonly options: FakeAiCardGeneratorOptions = {}) {}

  async generateDrafts(input: GenerateDraftsInput): Promise<CardDraft[]> {
    this.calls.push(input);
    if (this.options.error) {
      throw this.options.error;
    }
    return this.options.drafts ?? [];
  }
}

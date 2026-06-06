// Port for AI-assisted flashcard drafting (ADR-003). The adapter owns the model
// call and shapes raw output into CardDraft[]; the use case then validates each
// draft against the shared card rules. Keeping the port small and provider-
// agnostic lets tests substitute a fake generator (Interface Segregation).

export interface CardDraft {
  frontText: string;
  backText: string;
}

export interface GenerateDraftsInput {
  topicOrNotes: string;
  maxDrafts: number;
}

export interface AiCardGenerator {
  generateDrafts(input: GenerateDraftsInput): Promise<CardDraft[]>;
}

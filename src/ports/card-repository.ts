export interface Card {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCardInput {
  deckId: string;
  frontText: string;
  backText: string;
}

export interface UpdateCardInput {
  frontText?: string;
  backText?: string;
}

export interface CardRepository {
  create(input: CreateCardInput, userId: string): Promise<Card>;
  findById(id: string, userId: string): Promise<Card | null>;
  listByDeckId(deckId: string, userId: string): Promise<Card[]>;
  update(id: string, userId: string, input: UpdateCardInput): Promise<Card>;
  delete(id: string, userId: string): Promise<void>;
}

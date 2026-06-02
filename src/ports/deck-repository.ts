export interface Deck {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeckInput {
  userId: string;
  title: string;
  description?: string;
}

export interface UpdateDeckInput {
  title?: string;
  description?: string;
}

export interface DeckRepository {
  create(input: CreateDeckInput): Promise<Deck>;
  findById(id: string, userId: string): Promise<Deck | null>;
  listByUserId(userId: string): Promise<Deck[]>;
  update(id: string, userId: string, input: UpdateDeckInput): Promise<Deck>;
  delete(id: string, userId: string): Promise<void>;
}

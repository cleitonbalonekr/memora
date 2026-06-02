import { DeckRepository, Deck, CreateDeckInput, UpdateDeckInput } from "@/ports/deck-repository";
import { db } from "./index";
import { decks } from "./schema";
import { eq, and } from "drizzle-orm";

export class DrizzleDeckRepository implements DeckRepository {
  async create(input: CreateDeckInput): Promise<Deck> {
    const [row] = await db
      .insert(decks)
      .values({
        userId: input.userId,
        title: input.title,
        description: input.description,
      })
      .returning();

    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findById(id: string, userId: string): Promise<Deck | null> {
    const [row] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, id), eq(decks.userId, userId)))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async listByUserId(userId: string): Promise<Deck[]> {
    const rows = await db
      .select()
      .from(decks)
      .where(eq(decks.userId, userId))
      .orderBy(decks.createdAt);

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async update(id: string, userId: string, input: UpdateDeckInput): Promise<Deck> {
    const [row] = await db
      .update(decks)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(decks.id, id), eq(decks.userId, userId)))
      .returning();

    if (!row) {
      throw new Error("Deck not found or unauthorized");
    }

    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(decks)
      .where(and(eq(decks.id, id), eq(decks.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new Error("Deck not found or unauthorized");
    }
  }
}

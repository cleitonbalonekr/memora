import { CardRepository, Card, CreateCardInput, UpdateCardInput } from "@/ports/card-repository";
import { db } from "./index";
import { cards, decks } from "./schema";
import { eq, and } from "drizzle-orm";

export class DrizzleCardRepository implements CardRepository {
  async create(input: CreateCardInput, userId: string): Promise<Card> {
    // 1. Verify deck ownership
    const [deck] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, input.deckId), eq(decks.userId, userId)))
      .limit(1);

    if (!deck) {
      throw new Error("Deck not found or unauthorized");
    }

    // 2. Insert card
    const [row] = await db
      .insert(cards)
      .values({
        deckId: input.deckId,
        frontText: input.frontText,
        backText: input.backText,
      })
      .returning();

    return {
      id: row.id,
      deckId: row.deckId,
      frontText: row.frontText,
      backText: row.backText,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findById(id: string, userId: string): Promise<Card | null> {
    // Find card and join decks to check ownership
    const rows = await db
      .select({
        card: cards,
        deckUserId: decks.userId,
      })
      .from(cards)
      .innerJoin(decks, eq(cards.deckId, decks.id))
      .where(and(eq(cards.id, id), eq(decks.userId, userId)))
      .limit(1);

    const match = rows[0];
    if (!match) return null;

    return {
      id: match.card.id,
      deckId: match.card.deckId,
      frontText: match.card.frontText,
      backText: match.card.backText,
      createdAt: match.card.createdAt,
      updatedAt: match.card.updatedAt,
    };
  }

  async listByDeckId(deckId: string, userId: string): Promise<Card[]> {
    // 1. Verify deck ownership
    const [deck] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
      .limit(1);

    if (!deck) {
      throw new Error("Deck not found or unauthorized");
    }

    // 2. List cards
    const rows = await db
      .select()
      .from(cards)
      .where(eq(cards.deckId, deckId))
      .orderBy(cards.createdAt);

    return rows.map((row) => ({
      id: row.id,
      deckId: row.deckId,
      frontText: row.frontText,
      backText: row.backText,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async update(id: string, userId: string, input: UpdateCardInput): Promise<Card> {
    // 1. Verify card ownership
    const currentCard = await this.findById(id, userId);
    if (!currentCard) {
      throw new Error("Card not found or unauthorized");
    }

    // 2. Update card
    const [row] = await db
      .update(cards)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, id))
      .returning();

    return {
      id: row.id,
      deckId: row.deckId,
      frontText: row.frontText,
      backText: row.backText,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async delete(id: string, userId: string): Promise<void> {
    // 1. Verify card ownership
    const currentCard = await this.findById(id, userId);
    if (!currentCard) {
      throw new Error("Card not found or unauthorized");
    }

    // 2. Delete card
    await db.delete(cards).where(eq(cards.id, id));
  }
}

import { CardRepository, Card, CreateCardInput, UpdateCardInput } from "@/ports/card-repository";
import { SrsState } from "@/features/study/domain/scheduler";
import { db } from "./index";
import { cards, decks } from "./schema";
import { eq, and, inArray, lte, isNull, sql } from "drizzle-orm";

type CardRow = typeof cards.$inferSelect;

// Single source of truth for row -> Card mapping, including the SRS columns, so
// every read returns the same shape (DRY: previously duplicated per method).
function toCard(row: CardRow): Card {
  return {
    id: row.id,
    deckId: row.deckId,
    frontText: row.frontText,
    backText: row.backText,
    intervalDays: row.intervalDays,
    ease: row.ease,
    reps: row.reps,
    lapses: row.lapses,
    dueDate: row.dueDate,
    firstReviewedAt: row.firstReviewedAt,
    suspendedAt: row.suspendedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Subquery of deck ids owned by the user; used to scope card writes to the
// acting user without a join (mirrors the existing update/delete pattern).
function ownedDeckIds(userId: string) {
  return db.select({ id: decks.id }).from(decks).where(eq(decks.userId, userId));
}

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

    return toCard(row);
  }

  async createMany(inputs: CreateCardInput[], userId: string): Promise<Card[]> {
    if (inputs.length === 0) return [];

    const [deck] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, inputs[0].deckId), eq(decks.userId, userId)))
      .limit(1);

    if (!deck) {
      throw new Error("Deck not found or unauthorized");
    }

    const rows = await db
      .insert(cards)
      .values(inputs.map((input) => ({
        deckId: input.deckId,
        frontText: input.frontText,
        backText: input.backText,
      })))
      .returning();

    return rows.map(toCard);
  }

  async findById(id: string, userId: string): Promise<Card | null> {
    // Find card and join decks to check ownership
    const rows = await db
      .select({ card: cards })
      .from(cards)
      .innerJoin(decks, eq(cards.deckId, decks.id))
      .where(and(eq(cards.id, id), eq(decks.userId, userId)))
      .limit(1);

    const match = rows[0];
    if (!match) return null;

    return toCard(match.card);
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

    return rows.map(toCard);
  }

  async listDueForStudy(
    deckId: string,
    userId: string,
    today: Date,
    newLimit: number,
  ): Promise<Card[]> {
    // 1. Verify deck ownership once.
    const [deck] = await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
      .limit(1);

    if (!deck) {
      throw new Error("Deck not found or unauthorized");
    }

    // 2. Due, non-suspended reviews, most overdue first.
    const dueReviews = await db
      .select()
      .from(cards)
      .where(
        and(
          eq(cards.deckId, deckId),
          isNull(cards.suspendedAt),
          lte(cards.dueDate, today),
        ),
      )
      .orderBy(cards.dueDate);

    // 3. New-card allowance left for today = limit minus those already introduced.
    const [{ count: newToday }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(cards)
      .where(and(eq(cards.deckId, deckId), eq(cards.firstReviewedAt, today)));

    const remaining = Math.max(0, newLimit - newToday);

    const newCards = remaining === 0
      ? []
      : await db
          .select()
          .from(cards)
          .where(
            and(
              eq(cards.deckId, deckId),
              isNull(cards.suspendedAt),
              isNull(cards.dueDate),
            ),
          )
          .orderBy(cards.createdAt)
          .limit(remaining);

    return [...dueReviews, ...newCards].map(toCard);
  }

  async update(id: string, userId: string, input: UpdateCardInput): Promise<Card> {
    const [row] = await db
      .update(cards)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(eq(cards.id, id), inArray(cards.deckId, ownedDeckIds(userId))))
      .returning();

    if (!row) {
      throw new Error("Card not found or unauthorized");
    }

    return toCard(row);
  }

  async saveReviewState(cardId: string, userId: string, state: SrsState): Promise<void> {
    const rows = await db
      .update(cards)
      .set({
        intervalDays: state.intervalDays,
        ease: state.ease,
        reps: state.reps,
        lapses: state.lapses,
        dueDate: state.dueDate,
        firstReviewedAt: state.firstReviewedAt,
        suspendedAt: state.suspendedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(cards.id, cardId), inArray(cards.deckId, ownedDeckIds(userId))))
      .returning({ id: cards.id });

    if (rows.length === 0) {
      throw new Error("Card not found or unauthorized");
    }
  }

  async delete(id: string, userId: string): Promise<void> {
    const rows = await db
      .delete(cards)
      .where(and(eq(cards.id, id), inArray(cards.deckId, ownedDeckIds(userId))))
      .returning({ id: cards.id });

    if (rows.length === 0) {
      throw new Error("Card not found or unauthorized");
    }
  }
}

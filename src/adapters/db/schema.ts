import { pgTable, uuid, text, timestamp, integer, date, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Thin profile row linked to Supabase auth.users
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Decks table
export const decks = pgTable("decks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Cards table. The trailing columns hold spaced-repetition state (Anki-style
// modified SM-2 at day granularity): ease is stored as integer permille
// (2500 = 2.50) to avoid float drift; dueDate/firstReviewedAt are day-grained
// dates; suspendedAt marks a leech removed from the rotation. New columns are
// nullable or defaulted so existing cards become valid "new" cards (no backfill).
export const cards = pgTable(
  "cards",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
    deckId: uuid("deck_id").references(() => decks.id, { onDelete: "cascade" }).notNull(),
    frontText: text("front_text").notNull(),
    backText: text("back_text").notNull(),
    intervalDays: integer("interval_days").default(0).notNull(),
    ease: integer("ease").default(2500).notNull(),
    reps: integer("reps").default(0).notNull(),
    lapses: integer("lapses").default(0).notNull(),
    dueDate: date("due_date", { mode: "date" }),
    firstReviewedAt: date("first_reviewed_at", { mode: "date" }),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("cards_deck_id_due_date_idx").on(table.deckId, table.dueDate)],
);

import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
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

// Cards table
export const cards = pgTable("cards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`).notNull(),
  deckId: uuid("deck_id").references(() => decks.id, { onDelete: "cascade" }).notNull(),
  frontText: text("front_text").notNull(),
  backText: text("back_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

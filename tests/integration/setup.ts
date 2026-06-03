import { config as loadEnv } from "dotenv";

// MUST run before importing the db module: src/adapters/db/index.ts builds the
// postgres/drizzle client from process.env.DATABASE_URL at import time.
loadEnv({ path: ".env.test", override: true });

import { afterAll, afterEach } from "vitest";
import { sql } from "drizzle-orm";

// Dynamic import so the env above is in place when the singleton initializes.
const { db, client } = await import("@/adapters/db/index");

afterEach(async () => {
  await db.execute(
    sql`truncate table "cards", "decks", "profiles" restart identity cascade`,
  );
});

afterAll(async () => {
  await client.end({ timeout: 5 });
});

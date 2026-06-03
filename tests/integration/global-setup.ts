import { config as loadEnv } from "dotenv";

// Load the test env BEFORE anything reads process.env.DATABASE_URL.
loadEnv({ path: ".env.test", override: true });

import { execFileSync } from "node:child_process";
import postgres from "postgres";

// Runs once before the integration project. Verifies the test Postgres is up,
// guarantees the Supabase objects the RLS migration depends on, then applies the
// real Drizzle migrations (schema + RLS) to the test database.
export default async function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — check .env.test.");
  }

  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    try {
      await sql`select 1`;
    } catch {
      throw new Error(
        `Cannot reach the test database at ${url}\n` +
          "Start it with: docker compose -f docker-compose.test.yml up -d",
      );
    }

    // The supabase/postgres image normally ships these; this is an idempotent
    // safety net so `0001_auth_rls.sql` (which GRANTs to `authenticated` and
    // calls auth.uid()) always applies cleanly.
    await sql.unsafe(`
      do $$ begin
        if not exists (select from pg_roles where rolname = 'authenticated') then
          create role authenticated nologin noinherit;
        end if;
        if not exists (select from pg_roles where rolname = 'anon') then
          create role anon nologin noinherit;
        end if;
        if not exists (select from pg_roles where rolname = 'service_role') then
          create role service_role nologin noinherit bypassrls;
        end if;
      end $$;
      create schema if not exists auth;
      do $$ begin
        if to_regprocedure('auth.uid()') is null then
          create function auth.uid() returns uuid language sql stable as
            $f$ select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid $f$;
        end if;
      end $$;
    `);
  } finally {
    await sql.end({ timeout: 5 });
  }

  // drizzle.config.ts reads DATABASE_URL from the env we just loaded.
  execFileSync("npx", ["drizzle-kit", "migrate"], {
    stdio: "inherit",
    env: { ...process.env },
  });
}

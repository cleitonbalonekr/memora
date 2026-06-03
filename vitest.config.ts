import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

// Three projects, one runner. `@/*` resolves via vite-tsconfig-paths in each.
// Tests import { describe, it, expect, ... } from "vitest" explicitly (globals
// stay off) so no ESLint changes are needed.
export default defineConfig({
  test: {
    projects: [
      // Pure domain logic + parsers. No DB, no Supabase — runs anywhere.
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.unit.test.ts"],
        },
      },

      // Use cases through real Drizzle repositories against the test Postgres.
      // Auth is faked; the DB is the docker-compose.test.yml stack.
      {
        plugins: [tsconfigPaths()],
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.integration.test.ts"],
          globalSetup: ["./tests/integration/global-setup.ts"],
          setupFiles: ["./tests/integration/setup.ts"],
          // One shared postgres connection + truncate-between-tests: files must
          // not run in parallel or they would clobber each other's data.
          fileParallelism: false,
        },
      },

      // React 19 client components under jsdom with React Testing Library.
      {
        plugins: [tsconfigPaths(), react()],
        test: {
          name: "component",
          environment: "jsdom",
          include: ["src/**/*.component.test.tsx"],
          setupFiles: ["./tests/component/setup.ts"],
        },
      },
    ],
  },
});

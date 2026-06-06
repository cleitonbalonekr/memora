# Repository Guidelines
Project context:
Build a mobile-first flashcards web app where a signed-in user creates decks, fills each deck with cards, and studies them. Each card holds a question on the front and the answer on the back, following proven study technique: short, single-concept, active-recall cards. The app ships as a Progressive Web App (PWA) so users can install it and study on a phone. The standout feature is AI-assisted card creation: a user gives a topic or pastes notes, and the app drafts well-formed cards for a chosen deck.
## Project Structure & Module Organization

This is a Next.js 16 App Router application. Web entry points live in `src/app/`, global styles in `src/app/globals.css`, and static assets in `public/`. External boundaries are split into `src/ports/` interfaces and `src/adapters/` implementations. Drizzle database code lives in `src/adapters/db/`, with schema in `schema.ts` and migrations in `migrations/`. Product and design references live under `docs/`. The target architecture is feature-first (`src/features/<feature>/use-cases`, `domain`, `ui`) while preserving ports and adapters.

## Build, Test, and Development Commands

- `npm run dev`: start the Next development server.
- `npm run build`: create the production build.
- `npm run start`: serve the production build locally.
- `npm run lint`: run ESLint with Next and TypeScript rules.
- `npm run db:generate`: generate Drizzle migrations from schema changes.
- `npm run db:migrate`: apply Drizzle migrations using `DATABASE_URL`.
- `npm run db:studio`: open Drizzle Studio for database inspection.

## Coding Style & Naming Conventions

Use TypeScript strict mode and the `@/*` alias for imports from `src`. Keep domain logic pure; put database, auth, network, and provider calls in adapters or use cases. Use small ports such as `DeckRepository`. Each use case is a class with a single `execute(input)` method: dependencies enter through the constructor, runtime input through `execute`, and it is built by a per-call factory in `src/composition-root.ts` (see ADR-002/ADR-003). Authenticated use cases extend `AuthedUseCase` and resolve the acting user server-side, never from client input. Prefer kebab-case filenames (`drizzle-card-repository.ts`) and PascalCase React components and class names. Follow existing formatting: two-space indentation, double quotes, and no commented-out code.
Read @docs/architecture-and-rules.md to full architecture and code reference

## Testing Guidelines

No test runner script is configured yet. Follow `docs/architecture-and-rules.md`: static checks first, unit tests for pure domain rules, integration tests for use cases/routes, and a small Playwright E2E suite for critical journeys. Place tests under `tests/` or near the feature when tooling is added. Every bug fix should include a failing-before test.

## Security & Configuration Tips

Never hardcode secrets. `DATABASE_URL` is required for Drizzle and database access; auth/provider keys must stay server-side. Validate external input at web boundaries, enforce per-user ownership for deck and card reads/writes, and avoid logging secrets or personal data.

## Agent-Specific Instructions

Before changing Next.js code, read the relevant local guide in `node_modules/next/dist/docs/`; this project uses Next.js 16 and may differ from older conventions. Prefer `docs/architecture-and-rules.md` over generic framework assumptions when choosing structure or test strategy.

# Tests

The suite follows the Testing Trophy (see `docs/architecture-and-rules.md`) with
three Vitest projects, configured in `vitest.config.ts`.

| Project | Env | Files | Needs Docker? |
| --- | --- | --- | --- |
| `unit` | node | `src/**/*.unit.test.ts` | No — pure domain logic + parsers |
| `integration` | node | `src/**/*.integration.test.ts` | Yes — real Drizzle repos against the test Postgres; auth is faked (`tests/support/fake-auth-gateway.ts`) |
| `component` | jsdom | `src/**/*.component.test.tsx` | No — React Testing Library |

## Running

```bash
# Unit + component need nothing extra:
npm run test:unit
npm run test:component

# Integration + RLS need the test stack (Postgres + Auth + gateway):
docker compose -f docker-compose.test.yml up -d
npm run test:integration   # global-setup applies migrations (incl. RLS) to :54322
npm run test:rls           # RLS policy check (plain SQL) inside the db container

# Everything at once (test stack must be up):
npm test
```

The test stack is **ephemeral** (no volumes). For running the real app locally
use `docker compose up -d` (persistent) with `.env.local`.

## Auth primitives on plain Postgres

Migration `0001_auth_rls.sql` references Supabase objects (`auth.uid()`, the
`authenticated` role). `docker/init-auth.sql` provisions those on the plain
`postgres` image at startup (the integration global-setup also creates them
idempotently as a safety net), so the real migration applies and GoTrue has its
`auth` schema. The integration tests connect as superuser (RLS bypassed) and
verify the repositories' own `user_id` ownership filters; the RLS policies
themselves are verified by the SQL check in `tests/rls/`.

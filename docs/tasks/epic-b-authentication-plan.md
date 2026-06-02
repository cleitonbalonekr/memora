# Epic B: Authentication Execution Plan

Status: Planned  
Source: `docs/prd.md`, Epic B  
Architecture reference: `docs/architecture-and-rules.md`  
Last updated: 2026-06-02

## Goal

Ship email/password authentication with Supabase Auth, protected application routes, and strict per-user isolation for decks and cards. The implementation must keep auth concerns behind the existing `AuthGateway` port, validate all user input at web boundaries, and enforce ownership on every deck/card operation.

## Current Codebase Context

- Next.js 16 App Router is installed and the app currently has a placeholder `src/app/page.tsx`.
- Supabase SSR dependencies are already present: `@supabase/ssr` and `@supabase/supabase-js`.
- Existing auth boundary:
  - `src/ports/auth-gateway.ts`
  - `src/adapters/auth/client.ts`
  - `src/adapters/auth/supabase-auth-gateway.ts`
- Existing database schema:
  - `profiles` keyed by Supabase auth user id.
  - `decks.user_id` references `profiles.id`.
  - `cards.deck_id` references `decks.id`.
- Existing repository methods already accept `userId` for scoped deck/card reads and writes, but card update/delete should be tightened to avoid two-step authorization races.
- There is no test runner configured yet. Epic B should add the minimum useful test tooling or document manual verification if test setup is deferred.

## Architecture Decisions For Epic B

1. Use Supabase Auth directly through the existing `AuthGateway`; do not introduce Auth.js unless a later decision explicitly requires it. The PRD/task calls for Supabase authentication, and the codebase already has the Supabase adapter.
2. Use Server Actions for register, login, and logout forms because Next.js 16 guidance keeps credential handling server-side.
3. Add `src/proxy.ts` for optimistic route protection and Supabase session refresh. Next.js 16 calls middleware "Proxy"; use that convention.
4. Enforce authorization in use cases/repositories even when routes are protected. Proxy is not the authorization boundary.
5. Add Supabase/Postgres RLS policies as defense in depth for `profiles`, `decks`, and `cards`, and keep application-level user checks in repositories/use cases.
6. Keep UI mobile-first and based on the existing design references in `docs/design/sign_up_mobile` and `docs/design/log_in_mobile`.

## Delivery Sequence

### B1: Register With Email And Password

Scope:
- Create auth feature structure:
  - `src/features/auth/domain/password-policy.ts`
  - `src/features/auth/use-cases/register-user.ts`
  - `src/features/auth/ui/sign-up-form.tsx`
  - `src/app/(auth)/sign-up/page.tsx`
  - `src/app/(auth)/actions.ts`
- Add a shared typed action state shape for form errors if no suitable shared helper exists.
- Add a validation schema for sign-up input:
  - Valid email.
  - Password minimum length and complexity aligned with the product standard.
  - Trim/lowercase email before passing to Supabase.
- Call `SupabaseAuthGateway.signUp`.
- Create or upsert the matching `profiles` row after successful Supabase registration.
- Return safe, user-facing auth errors; do not expose raw provider messages verbatim if they leak implementation details.
- Redirect authenticated users away from `/sign-up` to the app home/decks route.

Acceptance criteria:
- A visitor can open `/sign-up`, submit email/password, and receive validation feedback without a full custom API route.
- A successful registration creates a Supabase auth user and an app `profiles` row with the same id.
- Duplicate email and invalid password cases produce safe form errors.
- No password is stored in the app database.

Implementation notes:
- Prefer idempotent profile creation to tolerate Supabase email confirmation/session edge cases.
- Confirm whether email confirmation is enabled in Supabase. If enabled, route to a "check your email" state; if disabled for MVP, redirect directly after sign-up.

### B2: Login And Logout

Scope:
- Create:
  - `src/features/auth/use-cases/login-user.ts`
  - `src/features/auth/use-cases/logout-user.ts`
  - `src/features/auth/ui/log-in-form.tsx`
  - `src/features/auth/ui/logout-button.tsx`
  - `src/app/(auth)/log-in/page.tsx`
- Add login form validation:
  - Valid email.
  - Non-empty password.
- Call `SupabaseAuthGateway.signIn`.
- Ensure `profiles` exists after login as a repair path for users created before profile insertion or after email confirmation.
- Add logout Server Action that calls `signOut`, clears the Supabase session cookies through the SSR client, and redirects to `/log-in`.
- Update navigation/landing behavior:
  - Signed-out root route should send users to `/log-in` or show auth entry points.
  - Signed-in root route should send users to the protected app route.

Acceptance criteria:
- A registered user can log in with email/password.
- Invalid credentials produce a safe error.
- A signed-in user can log out and cannot access protected app routes afterward.
- Session cookies are HTTP-only/Supabase-managed and not manually exposed to client code.

### B3: Per-User Data Isolation

Scope:
- Add database migration for RLS and policies on app-owned tables:
  - Enable RLS for `profiles`, `decks`, and `cards`.
  - `profiles`: users can select/update only their own row.
  - `decks`: users can select/insert/update/delete only rows where `user_id = auth.uid()`.
  - `cards`: users can select/insert/update/delete only cards whose deck belongs to `auth.uid()`.
- Review database access mode:
  - If server repositories use a privileged `DATABASE_URL`, keep application-level checks mandatory and document that RLS protects direct Supabase client access.
  - If repositories move to Supabase client queries later, ensure they run as the authenticated user so RLS applies directly.
- Tighten repository methods:
  - Keep `DeckRepository` methods scoped by `userId`.
  - Change card update/delete to perform authorization in the mutation statement, using a join/subquery condition rather than `findById` followed by unscoped update/delete.
  - Add a scoped bulk insert method only when AI card creation needs it; it must verify deck ownership once inside the same operation.
- Add use case authorization helpers:
  - A small `requireCurrentUser(authGateway)` helper in the auth feature or shared server area.
  - Use cases must receive the current user id from the server boundary, not from form fields.
- Normalize unauthorized/not-found behavior:
  - Do not reveal whether another user's deck/card exists.
  - Return `not_found` or `unauthorized` typed results and map them safely in the web layer.

Acceptance criteria:
- User A cannot list, open, update, delete, or create cards in User B's decks.
- User A cannot infer ownership from different error messages.
- All deck/card repository methods require `userId` for read/write operations.
- RLS policies exist in migrations and are documented.

Security test cases:
- User A attempts to fetch User B's deck by id.
- User A attempts to update/delete User B's deck by id.
- User A attempts to list cards in User B's deck.
- User A attempts to create/update/delete a card in User B's deck.
- All cases fail without changing data.

### B4: Route Protection

Scope:
- Add `src/proxy.ts` using the Supabase SSR client pattern for session refresh and route checks.
- Protected routes:
  - `/decks`
  - `/decks/:path*`
  - Future app routes for cards, study mode, and AI card generation.
- Public auth routes:
  - `/log-in`
  - `/sign-up`
  - Static assets and framework internals.
- Add a protected app layout if helpful:
  - `src/app/(app)/layout.tsx`
  - The layout can perform a server-side user check and redirect as a second layer.
- Authenticated users visiting `/log-in` or `/sign-up` should redirect to `/decks`.
- Unauthenticated users visiting protected routes should redirect to `/log-in?next=<path>` with safe relative-path handling.

Acceptance criteria:
- Protected routes are unreachable when signed out.
- Auth routes do not show login/register forms to an already signed-in user.
- Session refresh works across server renders and form actions.
- Route protection does not run on `_next`, image assets, favicon, or static files.

## Testing Plan

If test tooling is added in this Epic:
- Add Vitest for use case/domain tests.
- Add React Testing Library for auth form behavior.
- Add Playwright only if the team wants E2E setup now; otherwise create the first E2E in the later CRUD epic.

Minimum automated tests for Epic B:
- Password policy accepts/rejects expected passwords.
- Register use case validates input, calls auth gateway, and creates a profile.
- Login use case validates input and ensures profile existence.
- Logout action calls the auth gateway and redirects.
- Deck repository rejects cross-user reads/writes.
- Card repository rejects cross-user reads/writes, especially update/delete.

Manual verification checklist:
- Register a new user from `/sign-up`.
- Log out and log in again from `/log-in`.
- Refresh the browser and confirm the session remains active.
- Visit protected routes while signed out and confirm redirect to `/log-in`.
- Create two test users in the database and manually verify cross-user deck/card operations fail.

## Environment And Configuration

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

Supabase project settings to confirm:
- Email/password auth enabled.
- Email confirmation decision for MVP documented.
- Site URL and redirect URLs configured for local development and deployment.
- RLS enabled on app tables after migration.

## Risks And Mitigations

- Supabase email confirmation can make sign-up appear to fail if the app expects an immediate session. Mitigation: explicitly handle both confirmed-session and check-email states.
- RLS may not protect Drizzle queries if `DATABASE_URL` uses a privileged server role. Mitigation: keep repository/use-case ownership checks mandatory and use RLS as database-level defense for authenticated Supabase access.
- Two-step authorization in card update/delete can race. Mitigation: replace with single scoped mutation queries.
- Raw provider errors may leak implementation detail. Mitigation: map known Supabase errors to safe messages.
- Route protection alone is insufficient. Mitigation: enforce auth in Server Actions/use cases and repositories.

## Definition Of Done

- B1 through B4 acceptance criteria are met.
- Auth pages follow mobile-first design references.
- Supabase sessions are created, refreshed, and cleared correctly.
- `profiles`, `decks`, and `cards` have RLS policies in migrations.
- Deck/card access is scoped by authenticated user id in every repository/use case.
- Static checks pass with `npm run lint` and `npm run build`.
- Tests or a documented manual verification checklist cover register, login, logout, route protection, and cross-user isolation.

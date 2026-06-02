# Epic B Authentication Verification

Automated test tooling is not configured in this repository yet. Use this checklist after applying migrations and setting the required environment variables.

Required environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

Supabase project settings to confirm:

- Email/password auth is enabled.
- Email confirmation behavior is known. If enabled, sign-up should show the check-email message.
- Local and deployed site URLs are configured in Supabase Auth redirects.

Manual checks:

1. Visit `/sign-up` while signed out, submit an invalid email and weak password, and confirm field errors render without a route handler.
2. Register a new email/password account and confirm a `profiles` row exists with the Supabase auth user id.
3. Log out from `/decks`, then confirm `/decks` redirects to `/log-in?next=/decks`.
4. Log in from `/log-in` and confirm the app redirects to `/decks`.
5. Refresh `/decks` and confirm the session remains active.
6. Visit `/log-in` and `/sign-up` while signed in and confirm both redirect to `/decks`.
7. Create two users and test repository operations manually:
   - User A cannot fetch User B's deck by id.
   - User A cannot update or delete User B's deck by id.
   - User A cannot list cards in User B's deck.
   - User A cannot create, update, or delete cards in User B's deck.
8. Apply `src/adapters/db/migrations/0001_auth_rls.sql` and confirm RLS is enabled on `profiles`, `decks`, and `cards`.

Notes:

- Drizzle repositories still use `DATABASE_URL`, so application-level ownership checks remain mandatory even with RLS enabled.
- RLS protects authenticated Supabase Data API access as defense in depth.

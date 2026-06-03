-- RLS check that the decks policies (migration 0001_auth_rls.sql) isolate users
-- at the database level — the defense-in-depth layer beneath the repositories'
-- own user_id filters. Plain SQL (no pgtap): assertions RAISE on failure and,
-- with psql -v ON_ERROR_STOP=1, make the run exit non-zero.
--
-- Prerequisite: schema + policies applied to the test DB (run
-- `npm run test:integration` once, or `npm run db:migrate` against it). Then:
-- `npm run test:rls`.

begin;

-- Seed two users and a deck owned by the first. As superuser, RLS is bypassed.
insert into profiles (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'owner@example.com'),
  ('22222222-2222-4222-8222-222222222222', 'intruder@example.com');
insert into decks (id, user_id, title) values
  ('33333333-3333-4333-8333-333333333333',
   '11111111-1111-4111-8111-111111111111', 'Owner deck');

-- Act as an authenticated user with the intruder's id. RLS now applies and
-- auth.uid() resolves from request.jwt.claims.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222"}';

do $$
begin
  if (select count(*) from decks) <> 0 then
    raise exception 'RLS FAIL: intruder can see % deck(s)', (select count(*) from decks);
  end if;
end $$;

-- An update from the intruder matches no rows (filtered by the USING clause).
update decks set title = 'hijacked'
where id = '33333333-3333-4333-8333-333333333333';

-- Re-read as the owner.
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111"}';

do $$
begin
  if (select title from decks where id = '33333333-3333-4333-8333-333333333333')
       is distinct from 'Owner deck' then
    raise exception 'RLS FAIL: intruder modified the deck';
  end if;
  if (select count(*) from decks) <> 1 then
    raise exception 'RLS FAIL: owner does not see exactly their own deck';
  end if;
end $$;

\echo 'RLS OK: decks are isolated per user'

rollback;

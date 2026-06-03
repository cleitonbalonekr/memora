-- Provision the Supabase auth primitives this app relies on so it can run
-- against a plain Postgres image: the roles the RLS policies GRANT to, the
-- `auth` schema, and auth.uid() (reads the JWT `sub` claim). Runs once at db
-- init (every `up` for the ephemeral test stack, which has no volume).
do $$ begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create or replace function auth.uid() returns uuid
  language sql stable
as $func$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$func$;

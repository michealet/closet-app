-- Row-level security for public.profiles: a user can read and edit only her own row.
-- Run with `pnpm test:db` (needs `supabase start`).
begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

-- Two users; the on_auth_user_created trigger creates their profiles.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com');

update public.profiles set display_name = 'B'
where id = '00000000-0000-0000-0000-00000000000b';

-- Act as user A.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}',
  true
);

select results_eq(
  'select id from public.profiles',
  $$ values ('00000000-0000-0000-0000-00000000000a'::uuid) $$,
  'A sees only her own profile'
);

select is_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000b' $$,
  'A cannot read B''s profile by id'
);

select lives_ok(
  $$ update public.profiles set display_name = 'Mine'
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  'A can update her own display name'
);

-- RLS silently filters the row, so the update succeeds but changes nothing.
update public.profiles set display_name = 'Hacked'
where id = '00000000-0000-0000-0000-00000000000b';

select throws_ok(
  $$ insert into public.profiles (id) values (gen_random_uuid()) $$,
  '42501',
  null,
  'A cannot insert profiles'
);

select throws_ok(
  $$ update public.profiles set created_at = now()
     where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501',
  null,
  'A cannot change columns other than display_name'
);

-- Anonymous visitors see nothing.
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is_empty('select 1 from public.profiles', 'anon sees no profiles');

-- Check the results as the table owner.
reset role;

select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-00000000000b'),
  'B',
  'B''s display name is unchanged after A''s update attempt'
);

select is(
  (select display_name from public.profiles
   where id = '00000000-0000-0000-0000-00000000000a'),
  'Mine',
  'A''s own update was saved'
);

select * from finish();
rollback;

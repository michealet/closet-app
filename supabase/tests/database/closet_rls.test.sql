-- Row-level security and integrity for the closet tables and the `closet` bucket:
-- a user can read and write only her own rows and files, and can't link
-- her rows to another user's items or outfits.
-- Run with `pnpm test:db` (needs `supabase start`).
begin;

create extension if not exists pgtap with schema extensions;

select plan(29);

-- Users A and B; B owns an item, an outfit and a file, created as the table owner.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com');

insert into public.clothing_items (id, user_id, name, category, image_path) values
  ('11111111-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b',
   'B top', 'tops', '00000000-0000-0000-0000-00000000000b/items/b.webp');
insert into public.outfits (id, user_id, name) values
  ('22222222-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000b', 'B outfit');
insert into storage.objects (bucket_id, name, owner_id) values
  ('closet', '00000000-0000-0000-0000-00000000000b/items/b.webp', '00000000-0000-0000-0000-00000000000b');

-- Act as user A.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}',
  true
);

-- clothing_items ------------------------------------------------------------

select lives_ok(
  $$ insert into public.clothing_items (id, name, category, image_path, seasons) values
     ('11111111-0000-0000-0000-00000000000a', 'A top', 'tops',
      '00000000-0000-0000-0000-00000000000a/items/a.webp', '{spring,summer}') $$,
  'A can add an item without passing user_id'
);

select is(
  (select user_id from public.clothing_items where id = '11111111-0000-0000-0000-00000000000a'),
  '00000000-0000-0000-0000-00000000000a'::uuid,
  'user_id defaults to the signed-in user'
);

select results_eq(
  'select id from public.clothing_items',
  $$ values ('11111111-0000-0000-0000-00000000000a'::uuid) $$,
  'A sees only her own items'
);

select is(
  (select colors from public.clothing_items where id = '11111111-0000-0000-0000-00000000000a'),
  '{}'::public.clothing_color[],
  'An item has no colors by default'
);

select lives_ok(
  $$ update public.clothing_items set colors = '{black,white}'
     where id = '11111111-0000-0000-0000-00000000000a' $$,
  'A can give her item several colors (#12)'
);

select is(
  (select colors from public.clothing_items where id = '11111111-0000-0000-0000-00000000000a'),
  '{black,white}'::public.clothing_color[],
  '…and they are saved'
);

select throws_ok(
  $$ insert into public.clothing_items (user_id, name, category, image_path) values
     ('00000000-0000-0000-0000-00000000000b', 'Sneaky', 'tops',
      '00000000-0000-0000-0000-00000000000b/items/x.webp') $$,
  '42501', null,
  'A cannot add an item owned by B'
);

select throws_ok(
  $$ insert into public.clothing_items (name, category, image_path) values
     ('Wrong folder', 'tops', '00000000-0000-0000-0000-00000000000b/items/x.webp') $$,
  '23514', null,
  'An item''s image must be in its owner''s folder'
);

select throws_ok(
  $$ insert into public.clothing_items (name, category, image_path, notes) values
     ('Long notes', 'tops', '00000000-0000-0000-0000-00000000000a/items/n.webp', repeat('x', 501)) $$,
  '23514', null,
  'Notes are limited to 500 characters'
);

select throws_ok(
  $$ insert into public.clothing_items (name, category, image_path) values
     ('   ', 'tops', '00000000-0000-0000-0000-00000000000a/items/blank.webp') $$,
  '23514', null,
  'Item names cannot be blank'
);

update public.clothing_items set name = 'Hacked'
where id = '11111111-0000-0000-0000-00000000000b';

select throws_ok(
  $$ update public.clothing_items set user_id = '00000000-0000-0000-0000-00000000000b'
     where id = '11111111-0000-0000-0000-00000000000a' $$,
  '42501', null,
  'A cannot give her item to B'
);

-- outfits and outfit_items ---------------------------------------------------

select lives_ok(
  $$ insert into public.outfits (id, name, occasion, seasons) values
     ('22222222-0000-0000-0000-00000000000a', 'A outfit', 'date_night', '{fall}') $$,
  'A can add an outfit'
);

select results_eq(
  'select id from public.outfits',
  $$ values ('22222222-0000-0000-0000-00000000000a'::uuid) $$,
  'A sees only her own outfits'
);

select lives_ok(
  $$ insert into public.outfit_items (outfit_id, clothing_item_id, x, y, width, z_index) values
     ('22222222-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-00000000000a', 0.5, 0.2, 0.4, 1) $$,
  'A can place her item on her outfit'
);

select throws_ok(
  $$ insert into public.outfit_items (outfit_id, clothing_item_id, x, y, width) values
     ('22222222-0000-0000-0000-00000000000a', '11111111-0000-0000-0000-00000000000b', 0.5, 0.5, 0.3) $$,
  '42501', null,
  'A cannot place B''s item on her outfit'
);

select throws_ok(
  $$ insert into public.outfit_items (outfit_id, clothing_item_id, x, y, width) values
     ('22222222-0000-0000-0000-00000000000b', '11111111-0000-0000-0000-00000000000a', 0.5, 0.5, 0.3) $$,
  '42501', null,
  'A cannot place her item on B''s outfit'
);

select throws_ok(
  $$ update public.outfit_items set x = 1.5
     where outfit_id = '22222222-0000-0000-0000-00000000000a' $$,
  '23514', null,
  'Canvas positions must stay between 0 and 1'
);

-- planned_outfits ------------------------------------------------------------

select lives_ok(
  $$ insert into public.planned_outfits (outfit_id, date, event_name) values
     ('22222222-0000-0000-0000-00000000000a', '2026-10-10', 'Dinner'),
     ('22222222-0000-0000-0000-00000000000a', '2026-10-10', 'Party') $$,
  'A can plan her outfit, more than once a day'
);

select throws_ok(
  $$ insert into public.planned_outfits (outfit_id, date) values
     ('22222222-0000-0000-0000-00000000000b', '2026-10-11') $$,
  '42501', null,
  'A cannot plan B''s outfit'
);

-- storage ----------------------------------------------------------------------

select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('closet', '00000000-0000-0000-0000-00000000000a/items/a.webp', '00000000-0000-0000-0000-00000000000a') $$,
  'A can upload to her folder'
);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id) values
     ('closet', '00000000-0000-0000-0000-00000000000b/items/evil.webp', '00000000-0000-0000-0000-00000000000a') $$,
  '42501', null,
  'A cannot upload to B''s folder'
);

select results_eq(
  $$ select name from storage.objects where bucket_id = 'closet' $$,
  $$ values ('00000000-0000-0000-0000-00000000000a/items/a.webp'::text) $$,
  'A sees only her own files'
);

-- Cascades ---------------------------------------------------------------------

delete from public.clothing_items where id = '11111111-0000-0000-0000-00000000000a';

select is_empty(
  $$ select 1 from public.outfit_items where outfit_id = '22222222-0000-0000-0000-00000000000a' $$,
  'Deleting an item removes it from its outfits (ID-5)'
);

select isnt_empty(
  $$ select 1 from public.outfits where id = '22222222-0000-0000-0000-00000000000a' $$,
  '…and the outfit itself remains'
);

delete from public.outfits where id = '22222222-0000-0000-0000-00000000000a';

select is_empty(
  'select 1 from public.planned_outfits',
  'Deleting an outfit removes its calendar entries (OU-5)'
);

-- Signed-out visitors ------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select throws_ok(
  'select 1 from public.clothing_items',
  '42501', null,
  'anon cannot read clothing items'
);

select is_empty(
  $$ select 1 from storage.objects where bucket_id = 'closet' $$,
  'anon sees no closet files'
);

-- Check B's data as the table owner -----------------------------------------------

reset role;

select is(
  (select name from public.clothing_items where id = '11111111-0000-0000-0000-00000000000b'),
  'B top',
  'B''s item is unchanged after A''s update attempt'
);

select is(
  (select public from storage.buckets where id = 'closet'),
  false,
  'The closet bucket is private'
);

select * from finish();
rollback;

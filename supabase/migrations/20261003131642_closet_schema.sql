-- Closet data model (FRD §13): clothing items, outfits, their canvas layout,
-- planned outfits, and the private `closet` storage bucket.
--
-- Ownership: every row belongs to auth.uid(). user_id defaults to the caller,
-- so app code never passes it, and RLS checks it on every read and write.
-- Cross-user references (someone else's item in my outfit, someone else's
-- outfit on my calendar) are rejected by the insert/update policies.

-- ---------------------------------------------------------------------------
-- Fixed lists (labels live in src/lib/constants.ts and must match these).
-- Postgres enums can gain values later (ALTER TYPE … ADD VALUE) but not lose them.
-- ---------------------------------------------------------------------------

create type public.clothing_category as enum (
  'tops', 'bottoms', 'dresses', 'sets', 'jackets_outerwear',
  'shoes', 'bags', 'accessories', 'jewelry'
);

create type public.clothing_color as enum (
  'black', 'white', 'cream', 'beige', 'brown', 'gray', 'navy', 'blue', 'green',
  'olive', 'yellow', 'orange', 'red', 'pink', 'purple', 'gold', 'silver',
  'multi_pattern'
);

-- "All Season" in the UI means all four values.
create type public.season as enum ('spring', 'summer', 'fall', 'winter');

create type public.occasion as enum (
  'casual', 'class', 'going_out', 'dinner', 'formal', 'work', 'vacation',
  'date_night', 'party', 'workout', 'other'
);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- clothing_items
-- ---------------------------------------------------------------------------

create table public.clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  category public.clothing_category not null,
  brand text check (char_length(brand) <= 80),
  color public.clothing_color,
  seasons public.season[] not null default '{}',
  notes text check (char_length(notes) <= 500),
  -- Storage paths in the `closet` bucket, always under the owner's folder:
  -- {user_id}/items/{id}.webp, {user_id}/items/{id}_thumb.webp
  image_path text not null check (split_part(image_path, '/', 1) = user_id::text),
  thumbnail_path text check (split_part(thumbnail_path, '/', 1) = user_id::text),
  -- Future: background-removed version (FRD AC-12).
  image_processed_path text check (split_part(image_processed_path, '/', 1) = user_id::text),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clothing_items is 'Clothing a user owns (FRD §5–7).';

create index clothing_items_user_created_idx on public.clothing_items (user_id, created_at desc);
create index clothing_items_user_category_idx on public.clothing_items (user_id, category);

create trigger clothing_items_set_updated_at
  before update on public.clothing_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- outfits
-- ---------------------------------------------------------------------------

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  occasion public.occasion,
  seasons public.season[] not null default '{}',
  notes text check (char_length(notes) <= 500),
  -- {user_id}/outfits/{id}.webp, generated when the outfit is saved (OC-10).
  thumbnail_path text check (split_part(thumbnail_path, '/', 1) = user_id::text),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.outfits is 'Saved outfits (FRD §8–9).';

create index outfits_user_created_idx on public.outfits (user_id, created_at desc);

create trigger outfits_set_updated_at
  before update on public.outfits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- outfit_items: which items are in an outfit, and where they sit on the canvas
-- ---------------------------------------------------------------------------

create table public.outfit_items (
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  -- Deleting a clothing item removes it from its outfits (FRD ID-5).
  clothing_item_id uuid not null references public.clothing_items (id) on delete cascade,
  -- Position and width relative to the canvas, 0–1 (OC-7). Height follows the image.
  x numeric not null check (x between 0 and 1),
  y numeric not null check (y between 0 and 1),
  width numeric not null check (width > 0 and width <= 1),
  z_index integer not null default 0,
  primary key (outfit_id, clothing_item_id)
);

comment on table public.outfit_items is 'Items placed on an outfit canvas (FRD OC-4–OC-7).';

-- "Outfits using this item" (ID-3) and the delete warning count (ID-5).
create index outfit_items_clothing_item_idx on public.outfit_items (clothing_item_id);

-- ---------------------------------------------------------------------------
-- planned_outfits: calendar entries (several per day allowed, CA-5)
-- ---------------------------------------------------------------------------

create table public.planned_outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Deleting an outfit removes its calendar entries (OU-5).
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  date date not null,
  event_name text check (char_length(event_name) <= 100),
  created_at timestamptz not null default now()
);

comment on table public.planned_outfits is 'Outfits planned for a date (FRD §10).';

create index planned_outfits_user_date_idx on public.planned_outfits (user_id, date);
create index planned_outfits_outfit_idx on public.planned_outfits (outfit_id);

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.clothing_items enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.planned_outfits enable row level security;

-- Signed-out visitors get nothing, even before RLS.
revoke all on public.clothing_items, public.outfits, public.outfit_items, public.planned_outfits from anon;

-- clothing_items and outfits: owner only.
create policy "Owners can read their clothing items"
  on public.clothing_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Owners can add clothing items"
  on public.clothing_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Owners can update their clothing items"
  on public.clothing_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Owners can delete their clothing items"
  on public.clothing_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can read their outfits"
  on public.outfits for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Owners can add outfits"
  on public.outfits for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Owners can update their outfits"
  on public.outfits for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Owners can delete their outfits"
  on public.outfits for delete to authenticated
  using ((select auth.uid()) = user_id);

-- outfit_items: the outfit must be yours, and so must the item you place on it.
create policy "Owners can read their outfit items"
  on public.outfit_items for select to authenticated
  using (exists (
    select 1 from public.outfits o
    where o.id = outfit_id and o.user_id = (select auth.uid())
  ));
create policy "Owners can place their items on their outfits"
  on public.outfit_items for insert to authenticated
  with check (
    exists (select 1 from public.outfits o
            where o.id = outfit_id and o.user_id = (select auth.uid()))
    and exists (select 1 from public.clothing_items c
                where c.id = clothing_item_id and c.user_id = (select auth.uid()))
  );
create policy "Owners can move items on their outfits"
  on public.outfit_items for update to authenticated
  using (exists (
    select 1 from public.outfits o
    where o.id = outfit_id and o.user_id = (select auth.uid())
  ))
  with check (
    exists (select 1 from public.outfits o
            where o.id = outfit_id and o.user_id = (select auth.uid()))
    and exists (select 1 from public.clothing_items c
                where c.id = clothing_item_id and c.user_id = (select auth.uid()))
  );
create policy "Owners can remove items from their outfits"
  on public.outfit_items for delete to authenticated
  using (exists (
    select 1 from public.outfits o
    where o.id = outfit_id and o.user_id = (select auth.uid())
  ));

-- planned_outfits: the plan and the outfit it points to must both be yours.
create policy "Owners can read their plans"
  on public.planned_outfits for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Owners can plan their outfits"
  on public.planned_outfits for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.outfits o
                where o.id = outfit_id and o.user_id = (select auth.uid()))
  );
create policy "Owners can update their plans"
  on public.planned_outfits for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.outfits o
                where o.id = outfit_id and o.user_id = (select auth.uid()))
  );
create policy "Owners can delete their plans"
  on public.planned_outfits for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private `closet` bucket; each user reads and writes only under {user_id}/
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('closet', 'closet', false, 5242880, array['image/webp', 'image/jpeg']);

create policy "Closet: owners can read their files"
  on storage.objects for select to authenticated
  using (bucket_id = 'closet' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Closet: owners can upload to their folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'closet' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Closet: owners can replace their files"
  on storage.objects for update to authenticated
  using (bucket_id = 'closet' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'closet' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Closet: owners can delete their files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'closet' and (storage.foldername(name))[1] = (select auth.uid())::text);

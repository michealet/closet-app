-- Free tags on clothing items, to search and filter by (issue #36).
-- Additive: existing rows get no tags. Existing RLS policies on
-- clothing_items cover the new column.

-- At most 20 tags, each 1–30 characters, lowercase and unique. The app
-- normalizes tags; this keeps the data clean whatever the client sends.
create function public.valid_item_tags(tags text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(tags) <= 20
    and not exists (
      select 1 from unnest(tags) as t(tag)
      where char_length(tag) not between 1 and 30
        or tag <> lower(btrim(tag))
    )
    and cardinality(tags) = (select count(distinct tag) from unnest(tags) as t(tag));
$$;

alter table public.clothing_items
  add column tags text[] not null default '{}'
    constraint clothing_items_tags_valid check (public.valid_item_tags(tags));

comment on column public.clothing_items.tags is
  'Free tags (e.g. "linen", "thrifted"): lowercase, unique, ≤ 20 × 30 chars.';

-- Filtering by tag (FRD CL-3).
create index clothing_items_tags_idx on public.clothing_items using gin (tags);

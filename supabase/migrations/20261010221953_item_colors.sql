-- Items can have several colors (issue #12, FRD §19 Q1).
-- Additive: `colors` replaces `color`, which stays until nothing uses it and is
-- dropped in a later migration. Existing RLS policies on clothing_items cover
-- the new column.

alter table public.clothing_items
  add column colors public.clothing_color[] not null default '{}';

update public.clothing_items
set colors = array[color]
where color is not null;

comment on column public.clothing_items.colors is
  'Colors of the item, any number; "multi_pattern" for patterned items.';
comment on column public.clothing_items.color is
  'Deprecated: use colors. Will be dropped.';

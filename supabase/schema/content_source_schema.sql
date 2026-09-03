-- Supabase recipe and integrated-search source schema draft.
-- This file is a reviewed schema draft, not a generated migration.
-- When the CLI is available, create a migration with
-- `supabase migration new content_source_schema` and copy this SQL into it.

do $$
begin
  create type public.content_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.find_entry_kind as enum ('material', 'pos');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.recipes (
  id text primary key,
  name text not null,
  category text not null,
  sub_category text not null,
  chosung text,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipe_details (
  recipe_id text primary key references public.recipes(id) on delete cascade,
  hero_visuals jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  store_serving jsonb not null default '[]'::jsonb,
  packaging jsonb not null default '[]'::jsonb,
  delivery jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.find_entries (
  id text primary key,
  recipe_id text not null,
  kind public.find_entry_kind not null,
  title text not null,
  summary text not null,
  notes text,
  chosung text,
  status public.content_status not null default 'draft',
  sort_order integer not null default 0,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.find_entry_keywords (
  entry_id text not null references public.find_entries(id) on delete cascade,
  keyword text not null,
  sort_order integer not null default 0,
  primary key (entry_id, keyword)
);

create index if not exists recipes_status_category_idx
  on public.recipes (status, category, sub_category, sort_order);

create index if not exists recipes_chosung_idx
  on public.recipes (chosung);

create index if not exists find_entries_status_kind_idx
  on public.find_entries (status, kind, sort_order);

create index if not exists find_entries_recipe_id_idx
  on public.find_entries (recipe_id);

create index if not exists find_entry_keywords_keyword_idx
  on public.find_entry_keywords (keyword);

alter table public.recipes enable row level security;
alter table public.recipe_details enable row level security;
alter table public.find_entries enable row level security;
alter table public.find_entry_keywords enable row level security;

grant select, insert, update, delete on table public.recipes to anon, authenticated;
grant select, insert, update, delete on table public.recipe_details to anon, authenticated;
grant select, insert, update, delete on table public.find_entries to anon, authenticated;
grant select, insert, update, delete on table public.find_entry_keywords to anon, authenticated;

create policy "Sajang client can manage recipe source rows."
  on public.recipes
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "Sajang client can manage recipe detail source rows."
  on public.recipe_details
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "Sajang client can manage find entry source rows."
  on public.find_entries
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "Sajang client can manage find entry keyword rows."
  on public.find_entry_keywords
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Current store-only app model:
-- Sajang source editing uses the Expo publishable/anon key after the local
-- passcode gate. Employee-facing screens use the versioned device file cache.

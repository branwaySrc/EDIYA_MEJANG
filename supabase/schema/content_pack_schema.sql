-- Supabase content source and recipe/search pack manifest draft.
-- This file is a schema draft because the Supabase CLI is not available in this workspace.
-- When the CLI is available, create a migration with `supabase migration new content_pack_schema`
-- and move the reviewed SQL into the generated migration file.

create extension if not exists pgcrypto;

do $$
begin
  create type public.content_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_pack_scope as enum ('recipe_search');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.content_pack_checksum_algorithm as enum ('md5');
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

create table if not exists public.content_packs (
  id uuid primary key default gen_random_uuid(),
  scope public.content_pack_scope not null,
  status public.content_status not null default 'draft',
  pack_version text not null,
  schema_version integer not null,
  checksum text not null,
  checksum_algorithm public.content_pack_checksum_algorithm not null default 'md5',
  download_url text not null,
  min_app_version text,
  recipe_count integer not null default 0,
  find_entry_count integer not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (scope, pack_version)
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

create index if not exists content_packs_latest_idx
  on public.content_packs (scope, status, created_at desc);

alter table public.recipes enable row level security;
alter table public.recipe_details enable row level security;
alter table public.find_entries enable row level security;
alter table public.find_entry_keywords enable row level security;
alter table public.content_packs enable row level security;

revoke all on table public.content_packs from anon, authenticated;

grant select, insert, update, delete on table public.recipes to anon, authenticated;
grant select, insert, update, delete on table public.recipe_details to anon, authenticated;
grant select, insert, update, delete on table public.find_entries to anon, authenticated;
grant select, insert, update, delete on table public.find_entry_keywords to anon, authenticated;
grant select on table public.content_packs to anon, authenticated;

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

create policy "Published recipe search packs are readable."
  on public.content_packs
  for select
  to anon, authenticated
  using (scope = 'recipe_search' and status = 'published');

-- Current store-only app model:
-- Sajang source editing uses the Expo client publishable/anon key after the
-- local Sajang passcode gate. Employee-facing screens still read local SQLite
-- content packs and do not read these source tables in app code.

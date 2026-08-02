-- Compatibility patch kept for the old setup checklist filename.
--
-- This project now intentionally allows the Expo anon client to manage Sajang
-- recipe/search source tables after the local Sajang passcode gate.
-- For new work, prefer the clearer filename:
-- `schema/sajang_source_public_access.sql`.

alter table public.recipes enable row level security;
alter table public.recipe_details enable row level security;
alter table public.find_entries enable row level security;
alter table public.find_entry_keywords enable row level security;

grant select, insert, update, delete on table public.recipes to anon, authenticated;
grant select, insert, update, delete on table public.recipe_details to anon, authenticated;
grant select, insert, update, delete on table public.find_entries to anon, authenticated;
grant select, insert, update, delete on table public.find_entry_keywords to anon, authenticated;

drop policy if exists "Recipe source rows are locked for client roles." on public.recipes;
drop policy if exists "Recipe detail source rows are locked for client roles." on public.recipe_details;
drop policy if exists "Find entry source rows are locked for client roles." on public.find_entries;
drop policy if exists "Find entry keyword source rows are locked for client roles." on public.find_entry_keywords;

drop policy if exists "Sajang client can manage recipe source rows." on public.recipes;
drop policy if exists "Sajang client can manage recipe detail source rows." on public.recipe_details;
drop policy if exists "Sajang client can manage find entry source rows." on public.find_entries;
drop policy if exists "Sajang client can manage find entry keyword rows." on public.find_entry_keywords;

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

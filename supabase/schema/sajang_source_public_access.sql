-- Sajang source table access for the current store-only app model.
--
-- The Expo client uses the Supabase publishable/anon key. Because the Sajang
-- area is gated only by the app's local passcode for now, these source tables
-- must be reachable by anon for Sajang list/edit/delete flows to work.
--
-- Employee-facing recipe/search screens read the versioned device file cache.
-- This SQL only opens the Supabase source editing path.

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

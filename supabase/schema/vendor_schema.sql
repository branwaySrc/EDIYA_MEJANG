-- Supabase vendor management schema.
-- Apply from the Supabase SQL Editor for the store-only Sajang management model.

create extension if not exists pgcrypto;

do $$
begin
  create type public.vendor_status as enum ('active', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.vendors (
  id text primary key default gen_random_uuid()::text,
  store_id text not null default 'wolpi',
  name text not null,
  contact_name text not null default '',
  phone text not null default '',
  address text,
  items text[] not null default '{}',
  memo text,
  status public.vendor_status not null default 'active',
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists vendors_store_status_updated_at_idx
  on public.vendors (store_id, status, updated_at desc);

create index if not exists vendors_search_text_idx
  on public.vendors (search_text);

create or replace function public.touch_vendor_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  new.search_text = lower(trim(concat_ws(' ', new.name, new.contact_name, new.phone, array_to_string(new.items, ' '))));
  return new;
end;
$$;

drop trigger if exists vendors_touch_updated_at on public.vendors;

create trigger vendors_touch_updated_at
before insert or update on public.vendors
for each row
execute function public.touch_vendor_updated_at();

alter table public.vendors enable row level security;

grant select, insert, update on table public.vendors to anon, authenticated;

drop policy if exists "Store client can read vendors." on public.vendors;

create policy "Store client can read vendors."
  on public.vendors
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Store client can upsert vendors." on public.vendors;

create policy "Store client can upsert vendors."
  on public.vendors
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Store client can update vendors." on public.vendors;

create policy "Store client can update vendors."
  on public.vendors
  for update
  to anon, authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';

-- Current store-only app model:
-- Sajang screens are protected by the local passcode gate, and the Expo client
-- uses the publishable/anon key after that local gate. Do not expose a
-- service-role key in the Expo client.

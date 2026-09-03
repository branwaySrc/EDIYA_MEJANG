-- Supabase managed notices/manual/tutorial schema.
-- Apply from the Supabase SQL Editor for the store-only Sajang management model.

do $$
begin
  create type public.content_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.managed_content_documents (
  id text primary key,
  content_type text not null check (content_type in ('notice', 'manual', 'tutorial')),
  title text not null,
  description text,
  shift_group text,
  category_slug text,
  topic_slug text,
  keywords text[] not null default '{}',
  status public.content_status not null default 'published',
  sort_order integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  uploaded_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists managed_content_type_status_sort_idx
  on public.managed_content_documents (content_type, status, sort_order, updated_at desc);

create index if not exists managed_content_category_idx
  on public.managed_content_documents (category_slug)
  where category_slug is not null;

create index if not exists managed_content_topic_idx
  on public.managed_content_documents (topic_slug)
  where topic_slug is not null;

create index if not exists managed_content_search_text_idx
  on public.managed_content_documents (search_text);

create or replace function public.touch_managed_content_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  new.search_text = lower(trim(concat_ws(' ', new.title, new.description, new.shift_group, array_to_string(new.keywords, ' '))));
  return new;
end;
$$;

drop trigger if exists managed_content_touch_updated_at on public.managed_content_documents;

create trigger managed_content_touch_updated_at
before insert or update on public.managed_content_documents
for each row
execute function public.touch_managed_content_updated_at();

alter table public.managed_content_documents enable row level security;

grant select, insert, update on table public.managed_content_documents to anon, authenticated;

drop policy if exists "Store client can read managed content." on public.managed_content_documents;

create policy "Store client can read managed content."
  on public.managed_content_documents
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Sajang client can insert managed content." on public.managed_content_documents;

create policy "Sajang client can insert managed content."
  on public.managed_content_documents
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Sajang client can update managed content." on public.managed_content_documents;

create policy "Sajang client can update managed content."
  on public.managed_content_documents
  for update
  to anon, authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-content',
  'recipe-content',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Store client can upload managed content images." on storage.objects;

create policy "Store client can upload managed content images."
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'recipe-content'
    and name like 'managed-content/%'
  );

drop policy if exists "Store client can read managed content images." on storage.objects;

create policy "Store client can read managed content images."
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'recipe-content'
    and name like 'managed-content/%'
  );

drop policy if exists "Store client can replace managed content images." on storage.objects;

create policy "Store client can replace managed content images."
  on storage.objects
  for update
  to anon, authenticated
  using (
    bucket_id = 'recipe-content'
    and name like 'managed-content/%'
  )
  with check (
    bucket_id = 'recipe-content'
    and name like 'managed-content/%'
  );

notify pgrst, 'reload schema';

-- Current store-only app model:
-- Sajang screens are protected by the local passcode gate, and the Expo client
-- uses the publishable/anon key after that local gate. Do not expose a
-- service-role key in the Expo client.

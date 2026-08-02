-- Supabase prepaid customer and ledger schema draft.
-- This file is a schema draft because the Supabase CLI is not available in this workspace.
-- When the CLI is available, create a migration with `supabase migration new paid_customer_schema`
-- and move the reviewed SQL into the generated migration file.

create extension if not exists pgcrypto;

do $$
begin
  create type public.paid_customer_status as enum ('active', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.paid_ledger_entry_type as enum ('opening', 'charge', 'usage', 'refund', 'correction', 'void');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.paid_customers (
  id text primary key default gen_random_uuid()::text,
  store_id text not null default 'wolpi',
  name text not null,
  nickname text not null default '',
  affiliation text not null default '',
  phone text,
  memo text,
  first_paid_date date not null,
  initial_balance integer not null check (initial_balance >= 0),
  current_balance integer not null default 0 check (current_balance >= 0),
  status public.paid_customer_status not null default 'active',
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.paid_ledger_entries (
  id text primary key default gen_random_uuid()::text,
  store_id text not null default 'wolpi',
  customer_id text not null references public.paid_customers(id) on delete cascade,
  type public.paid_ledger_entry_type not null,
  amount integer not null check (amount >= 0),
  amount_delta integer not null,
  balance_before integer not null check (balance_before >= 0),
  balance_after integer not null check (balance_after >= 0),
  business_date date not null,
  occurred_at timestamptz not null default now(),
  memo text,
  created_by text,
  idempotency_key text,
  reversal_of_entry_id text references public.paid_ledger_entries(id),
  created_at timestamptz not null default now(),
  constraint paid_ledger_amount_direction_check check (
    (type in ('opening', 'charge', 'correction') and amount_delta >= 0)
    or (type in ('usage', 'refund') and amount_delta <= 0)
    or (type = 'void' and amount_delta = 0)
  )
);

create unique index if not exists paid_ledger_entries_idempotency_key_idx
  on public.paid_ledger_entries (idempotency_key)
  where idempotency_key is not null;

create index if not exists paid_customers_store_status_idx
  on public.paid_customers (store_id, status, updated_at desc);

create index if not exists paid_customers_search_text_idx
  on public.paid_customers (search_text);

create index if not exists paid_ledger_entries_customer_date_idx
  on public.paid_ledger_entries (customer_id, occurred_at desc);

create index if not exists paid_ledger_entries_store_business_date_idx
  on public.paid_ledger_entries (store_id, business_date desc);

create or replace function public.touch_paid_customer_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  new.search_text = lower(trim(concat_ws(' ', new.name, new.nickname, new.affiliation, new.phone)));
  return new;
end;
$$;

drop trigger if exists paid_customers_touch_updated_at on public.paid_customers;

create trigger paid_customers_touch_updated_at
before insert or update on public.paid_customers
for each row
execute function public.touch_paid_customer_updated_at();

create or replace function public.record_paid_ledger_entry(
  p_customer_id text,
  p_type public.paid_ledger_entry_type,
  p_amount integer,
  p_business_date date,
  p_memo text default null,
  p_created_by text default null,
  p_idempotency_key text default null,
  p_reversal_of_entry_id text default null
)
returns public.paid_ledger_entries
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_customer public.paid_customers%rowtype;
  v_delta integer;
  v_entry public.paid_ledger_entries%rowtype;
begin
  if p_amount <= 0 then
    raise exception 'paid ledger amount must be greater than 0';
  end if;

  if p_idempotency_key is not null then
    select *
      into v_entry
      from public.paid_ledger_entries
      where idempotency_key = p_idempotency_key;

    if found then
      return v_entry;
    end if;
  end if;

  select *
    into v_customer
    from public.paid_customers
    where id = p_customer_id
      and status = 'active'
    for update;

  if not found then
    raise exception 'active paid customer not found';
  end if;

  v_delta := case
    when p_type in ('usage', 'refund') then -p_amount
    when p_type = 'void' then 0
    else p_amount
  end;

  if v_customer.current_balance + v_delta < 0 then
    raise exception 'paid customer balance cannot be negative';
  end if;

  insert into public.paid_ledger_entries (
    store_id,
    customer_id,
    type,
    amount,
    amount_delta,
    balance_before,
    balance_after,
    business_date,
    memo,
    created_by,
    idempotency_key,
    reversal_of_entry_id
  )
  values (
    v_customer.store_id,
    v_customer.id,
    p_type,
    p_amount,
    v_delta,
    v_customer.current_balance,
    v_customer.current_balance + v_delta,
    p_business_date,
    p_memo,
    p_created_by,
    p_idempotency_key,
    p_reversal_of_entry_id
  )
  returning * into v_entry;

  update public.paid_customers
    set current_balance = v_entry.balance_after,
        updated_at = now()
    where id = v_customer.id;

  return v_entry;
end;
$$;

alter table public.paid_customers enable row level security;
alter table public.paid_ledger_entries enable row level security;

grant select, insert, update on table public.paid_customers to anon, authenticated;
grant select, insert on table public.paid_ledger_entries to anon, authenticated;
grant execute on function public.record_paid_ledger_entry(
  text,
  public.paid_ledger_entry_type,
  integer,
  date,
  text,
  text,
  text,
  text
) to anon, authenticated;

create policy "Store client can read prepaid customers."
  on public.paid_customers
  for select
  to anon, authenticated
  using (true);

create policy "Store client can create prepaid customers."
  on public.paid_customers
  for insert
  to anon, authenticated
  with check (true);

create policy "Store client can update prepaid customers."
  on public.paid_customers
  for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Store client can read prepaid ledger entries."
  on public.paid_ledger_entries
  for select
  to anon, authenticated
  using (true);

create policy "Store client can append prepaid ledger entries."
  on public.paid_ledger_entries
  for insert
  to anon, authenticated
  with check (true);

-- Current store-only app model:
-- The Expo client can manage prepaid customers after local in-app gating.
-- Ledger rows are append-only from the client. Balance updates should go through
-- record_paid_ledger_entry so each usage writes a ledger row and updates the
-- customer balance inside one database transaction.

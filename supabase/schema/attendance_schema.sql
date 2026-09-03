-- Supabase attendance schema for EDIYA_MEJANG.
-- Apply from the Supabase SQL Editor after reviewing.
-- Current model: store-only trusted Expo client. Sajang access is protected by
-- local app passcode, not DB/JWT role separation. Do not expose service_role
-- keys in the Expo client.

do $$
begin
  create type public.attendance_status as enum ('scheduled', 'completed', 'missed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_log_action as enum (
    'clock_in',
    'update',
    'confirm',
    'attendance_register',
    'attendance_cancel',
    'substitute_register',
    'substitute_cancel'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.attendance_month_status as enum ('open', 'closed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.attendance_records (
  id text primary key,
  store_id text not null default 'wolpi',
  employee_id text references public.employees(id) on delete cascade,
  is_vacant_slot boolean not null default false,
  work_date date not null,
  scheduled_start text,
  scheduled_end text,
  shift_group text not null,
  status public.attendance_status not null default 'scheduled',
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  confirmed_work_minutes integer check (confirmed_work_minutes is null or confirmed_work_minutes >= 0),
  substitute_employee_id text references public.employees(id) on delete set null,
  substitute_checked_in_at timestamptz,
  substitute_confirmed_work_minutes integer check (
    substitute_confirmed_work_minutes is null or substitute_confirmed_work_minutes >= 0
  ),
  updated_by_employee_id text not null references public.employees(id) on delete restrict,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (store_id, employee_id, work_date),
  constraint attendance_records_shift_group_valid
    check (shift_group in ('오픈', '미들', '마감')),
  constraint attendance_records_employee_id_vacant_check
    check (
      (is_vacant_slot = false and employee_id is not null)
      or (is_vacant_slot = true and employee_id is null)
    ),
  constraint attendance_records_scheduled_bounds_required
    check (
      is_vacant_slot = true
      or (scheduled_start is not null and scheduled_end is not null)
    )
);

-- Keep this block even when the table already exists. `create table if not
-- exists` does not update columns or constraints on an existing table.
alter table public.attendance_records
  add column if not exists is_vacant_slot boolean not null default false,
  add column if not exists shift_group text;

update public.attendance_records as attendance
set shift_group = employee.shift_group
from public.employees as employee
where attendance.shift_group is null
  and attendance.employee_id = employee.id;

do $$
begin
  if exists (
    select 1
    from public.attendance_records
    where shift_group is null
  ) then
    raise exception 'attendance_records.shift_group backfill left NULL rows';
  end if;
end $$;

alter table public.attendance_records
  alter column employee_id drop not null,
  alter column scheduled_start drop not null,
  alter column scheduled_end drop not null;

alter table public.attendance_records
  drop constraint if exists attendance_records_shift_group_valid,
  drop constraint if exists attendance_records_shift_group_not_null,
  drop constraint if exists attendance_records_employee_id_vacant_check,
  drop constraint if exists attendance_records_scheduled_bounds_required;

alter table public.attendance_records
  add constraint attendance_records_shift_group_valid
    check (shift_group in ('오픈', '미들', '마감')),
  add constraint attendance_records_shift_group_not_null
    check (shift_group is not null),
  add constraint attendance_records_employee_id_vacant_check
    check (
      (is_vacant_slot = false and employee_id is not null)
      or (is_vacant_slot = true and employee_id is null)
    ),
  add constraint attendance_records_scheduled_bounds_required
    check (
      is_vacant_slot = true
      or (scheduled_start is not null and scheduled_end is not null)
    );

create unique index if not exists attendance_records_vacant_unique_idx
  on public.attendance_records (store_id, work_date, shift_group)
  where is_vacant_slot = true;

create index if not exists attendance_records_store_date_idx
  on public.attendance_records (store_id, work_date, scheduled_start);

create index if not exists attendance_records_employee_date_idx
  on public.attendance_records (store_id, employee_id, work_date desc);

create index if not exists attendance_records_substitute_idx
  on public.attendance_records (store_id, substitute_employee_id, work_date desc)
  where substitute_employee_id is not null;

create table if not exists public.attendance_logs (
  id text primary key,
  store_id text not null default 'wolpi',
  attendance_id text not null references public.attendance_records(id) on delete cascade,
  employee_id text not null references public.employees(id) on delete cascade,
  action public.attendance_log_action not null,
  updated_by_employee_id text not null references public.employees(id) on delete restrict,
  created_at timestamptz not null default now(),
  message text not null
);

create index if not exists attendance_logs_store_created_idx
  on public.attendance_logs (store_id, created_at desc);

create index if not exists attendance_logs_attendance_idx
  on public.attendance_logs (store_id, attendance_id, created_at desc);

create index if not exists attendance_logs_employee_idx
  on public.attendance_logs (store_id, employee_id, created_at desc);

create table if not exists public.attendance_month_coverages (
  store_id text not null default 'wolpi',
  month_key text not null,
  status public.attendance_month_status not null default 'open',
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (store_id, month_key),
  check (month_key ~ '^[0-9]{4}-[0-9]{2}$')
);

create or replace function public.touch_attendance_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists attendance_records_touch_updated_at on public.attendance_records;

create trigger attendance_records_touch_updated_at
before update on public.attendance_records
for each row
execute function public.touch_attendance_updated_at();

drop trigger if exists attendance_month_coverages_touch_updated_at on public.attendance_month_coverages;

create trigger attendance_month_coverages_touch_updated_at
before update on public.attendance_month_coverages
for each row
execute function public.touch_attendance_updated_at();

alter table public.attendance_records enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.attendance_month_coverages enable row level security;

grant select, insert, update, delete on table public.attendance_records to anon, authenticated;
grant select, insert, delete on table public.attendance_logs to anon, authenticated;
grant select, insert, update on table public.attendance_month_coverages to anon, authenticated;

drop policy if exists "Store client can read attendance records." on public.attendance_records;
create policy "Store client can read attendance records."
  on public.attendance_records
  for select
  to anon, authenticated
  using (store_id = 'wolpi');

drop policy if exists "Store client can insert attendance records." on public.attendance_records;
create policy "Store client can insert attendance records."
  on public.attendance_records
  for insert
  to anon, authenticated
  with check (store_id = 'wolpi');

drop policy if exists "Store client can update attendance records." on public.attendance_records;
create policy "Store client can update attendance records."
  on public.attendance_records
  for update
  to anon, authenticated
  using (store_id = 'wolpi')
  with check (store_id = 'wolpi');

drop policy if exists "Store client can delete attendance records." on public.attendance_records;
create policy "Store client can delete attendance records."
  on public.attendance_records
  for delete
  to anon, authenticated
  using (store_id = 'wolpi');

drop policy if exists "Store client can read attendance logs." on public.attendance_logs;
create policy "Store client can read attendance logs."
  on public.attendance_logs
  for select
  to anon, authenticated
  using (store_id = 'wolpi');

drop policy if exists "Store client can insert attendance logs." on public.attendance_logs;
create policy "Store client can insert attendance logs."
  on public.attendance_logs
  for insert
  to anon, authenticated
  with check (store_id = 'wolpi');

drop policy if exists "Store client can delete attendance logs." on public.attendance_logs;
create policy "Store client can delete attendance logs."
  on public.attendance_logs
  for delete
  to anon, authenticated
  using (store_id = 'wolpi');

drop policy if exists "Store client can read attendance month coverages." on public.attendance_month_coverages;
create policy "Store client can read attendance month coverages."
  on public.attendance_month_coverages
  for select
  to anon, authenticated
  using (store_id = 'wolpi');

drop policy if exists "Store client can insert attendance month coverages." on public.attendance_month_coverages;
create policy "Store client can insert attendance month coverages."
  on public.attendance_month_coverages
  for insert
  to anon, authenticated
  with check (store_id = 'wolpi');

drop policy if exists "Store client can update attendance month coverages." on public.attendance_month_coverages;
create policy "Store client can update attendance month coverages."
  on public.attendance_month_coverages
  for update
  to anon, authenticated
  using (store_id = 'wolpi')
  with check (store_id = 'wolpi');

notify pgrst, 'reload schema';

# Supabase Setup Notes

This project is moving toward a split data model:

- Supabase is the source of truth for Sajang-managed content and operational data.
- Local SQLite cache is the employee-facing read path for recipe menus, recipe search, and integrated search.

## Current State

The Supabase CLI is not installed in this workspace, so files under `supabase/schema/` are reviewed schema drafts rather than generated migration files.

The target project for this app is:

- `https://nbeupbzteeaeuznuaibm.supabase.co`

The initial content schema was applied manually through Supabase outside Codex. A read-only check confirmed the expected public tables exist and RLS is enabled.

Before applying these drafts as real migrations:

1. Install and authenticate the Supabase CLI.
2. Run `supabase --help` and `supabase migration --help` to confirm the current CLI command shape.
3. Create a migration with `supabase migration new content_pack_schema`.
4. Move the reviewed SQL from `schema/content_pack_schema.sql` into the generated migration file.
5. Apply it to a local or staging database first.
6. Run Supabase advisors before applying it to production.

## Content Pack Flow

The current app uses a lighter SQLite cache-sync flow instead of generated pack files:

1. Sajang edits recipe and integrated-search source data in Supabase.
2. Sajang saves source rows as `published` by default.
3. Employee-facing app screens keep reading from local SQLite.
4. The settings screen update button fetches published source rows from Supabase.
5. The app overwrites the local SQLite recipe/search cache in a transaction.
6. The app reloads the employee-facing recipe/search store from SQLite.

Versioned SQLite pack files and `content_packs` manifests remain documented as a future scaling option, but they are not the default update path right now.

## Smoke Seed

Only smoke-test seed files are kept in this repo for now. Do not bulk-import the old `src/database` sample data until the Sajang editing and content-pack publish flow is ready.

Run these files through Supabase SQL Editor or another admin-capable database connection:

1. `seed/content_seed_smoke.sql`
2. `seed/content_seed_smoke_verify.sql`
3. Optional cleanup: `seed/content_seed_smoke_cleanup.sql`

The smoke seed inserts:

- one `recipes` row
- one `recipe_details` row
- one `find_entries` row
- two `find_entry_keywords` rows

The Expo app publishable/anon key can read and write source tables for the Sajang menu-management flow.

## Prepaid Customers

Prepaid customer data should use `schema/paid_customer_schema.sql` when it is promoted to Supabase.

The intended shape is:

- `paid_customers`: customer profile plus denormalized `current_balance`.
- `paid_ledger_entries`: append-only usage, charge, correction, refund, and opening-balance history.
- `record_paid_ledger_entry(...)`: atomic ledger insert plus customer balance update.

Do not treat the customer row alone as the source of truth for money movement. Every balance change should create a ledger row with `balance_before`, `amount_delta`, `balance_after`, `business_date`, and `occurred_at`.

## Security Notes

- Do not expose a Supabase service-role key in the Expo client.
- Sajang menu-management source tables are intentionally open to the Expo anon client for this store-only app model.
- Prepaid customer and ledger tables are sensitive because they include customer names and balances. Keep RLS enabled and avoid granting delete access to the Expo client; archive customers with `status` instead.
- Keep RLS enabled on tables in exposed schemas.
- `content_packs` remains read-only from the Expo client and exposes only published pack manifests.
- Employee-facing recipe/search screens should not query these source tables in app code; they keep reading local SQLite cache.

## Sajang Source Access Patch

After applying `schema/content_pack_schema.sql`, also run:

- `schema/sajang_source_public_access.sql`

This opens the source content tables to the Expo anon client for Sajang list/edit/delete flows:

- `recipes`
- `recipe_details`
- `find_entries`
- `find_entry_keywords`

`schema/content_pack_hardening.sql` is kept as a compatibility filename and now applies the same public Sajang access policy.

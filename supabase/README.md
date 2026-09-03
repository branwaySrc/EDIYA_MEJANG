# Supabase Setup Notes

This project uses a split content model:

- Supabase is the source of truth for Sajang-managed recipe and integrated-search content.
- A versioned JSON and image cache under the app document directory is the employee-facing read path.
- Employee-facing recipe and search screens do not query Supabase directly.

## Current State

The target project for this app is:

- `https://nbeupbzteeaeuznuaibm.supabase.co`

The source content tables and RLS were applied manually outside Codex. The Expo app uses only a publishable/anon key; never add a service-role key to the client.

The reviewed source schema is:

- `schema/content_source_schema.sql`

The current store-only access patch is:

- `schema/sajang_source_public_access.sql`

These files are reviewed drafts rather than generated migration files. When the Supabase CLI is available, create a migration with `supabase migration new content_source_schema`, copy the reviewed SQL into it, test locally or on staging, and run Supabase advisors before production use.

## Recipe and Search Flow

1. Sajang reads and writes recipe and integrated-search source rows in Supabase.
2. Sajang saves source rows as `published` by default.
3. Sajang uploads content images to the public `recipe-content` Storage bucket and stores only object paths in row JSON.
4. The settings update action fetches all published source rows.
5. The app downloads referenced Storage images into a new versioned generation under the app document directory.
6. The app validates the JSON snapshot and every downloaded image.
7. Only after validation succeeds does the active cache pointer switch to the new generation.
8. Zustand loads the active snapshot into memory for fast employee-facing recipe and chosung search.

A failed data or image download leaves the previous active generation untouched. Full snapshot replacement also removes rows that were deleted from Supabase.

## Storage Paths

The app expects the public bucket name `recipe-content` and writes unique object paths:

- `recipes/{recipe_id}/{visual_id}/{unique_file_name}`
- `find/{entry_id}/{visual_id}/{unique_file_name}`

The app does not overwrite an existing object path. When an edit succeeds, replaced object paths are removed after the database update. If the database update fails, newly uploaded objects are cleaned up on a best-effort basis.

Storage write and delete policies must be restricted to `bucket_id = 'recipe-content'`. The current deployment model permits the Expo anon client to manage this bucket after the local Sajang passcode gate. This is intentionally limited to the current store-only deployment and is not a substitute for server-verified owner authentication.

## Smoke Seed

Only smoke-test seed files are kept in this repo:

1. `seed/content_seed_smoke.sql`
2. `seed/content_seed_smoke_verify.sql`
3. Optional cleanup: `seed/content_seed_smoke_cleanup.sql`

The smoke seed inserts one recipe, one recipe detail, one integrated-search entry, and two keywords.

## Prepaid Customers

Prepaid customer data should use `schema/paid_customer_schema.sql` when it is promoted to Supabase.

- `paid_customers` stores the customer profile and denormalized current balance.
- `paid_ledger_entries` stores append-only money movements.
- Opening ledger rows may store a receipt image path in `receipt_storage_path`.
- Receipt images use the private Storage bucket `paid-receipts`.
- The app writes receipt object paths under `stores/{store_id}/customers/{customer_id}/ledger/{ledger_entry_id}/{unique_file_name}`.
- `record_paid_ledger_entry(...)` atomically inserts a ledger row and updates the customer balance.

Do not treat the customer row alone as the source of truth for money movement. Never expose a service-role key, keep RLS enabled, and do not grant ledger deletion to the Expo client.

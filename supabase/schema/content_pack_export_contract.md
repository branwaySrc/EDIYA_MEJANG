# Recipe/Search SQLite Pack Export Contract

The employee-facing app expects the recipe/search pack to be a complete SQLite database file, not a JSON delta.

## Scope

Current pack scope: `recipe_search`

The pack contains:

- recipe menu rows
- recipe detail JSON
- integrated search entries
- keyword/chosung data
- FTS search index
- local pack metadata

## Required SQLite Settings

The pack database must set:

```sql
PRAGMA user_version = 1;
```

The value must match `content_packs.schema_version`.

## Required Tables

The database must include:

- `app_settings`
- `recipes`
- `recipe_details`
- `find_entries`
- `search_index`

The app validates these tables before replacing the active local database.

## Required Metadata

`app_settings` should include:

- `content_pack_version`
- `content_pack_schema_version`
- `content_pack_applied_at`

The app writes these values again after applying a downloaded pack, but keeping them in the pack is useful for inspection.

## Manifest Row

After uploading the generated SQLite file, insert a `content_packs` row:

- `scope`: `recipe_search`
- `status`: `published`
- `pack_version`: monotonically increasing version string
- `schema_version`: `1`
- `checksum`: MD5 hash of the uploaded SQLite file
- `checksum_algorithm`: `md5`
- `download_url`: public or signed URL usable by the Expo app
- `min_app_version`: optional app version guard
- `recipe_count`: number of recipe rows
- `find_entry_count`: number of integrated search rows

## Replacement Safety

The app applies a downloaded pack only after:

1. Supabase manifest lookup succeeds.
2. The manifest is `published`.
3. `schema_version` is supported.
4. `min_app_version` is compatible.
5. Download succeeds.
6. MD5 checksum matches.
7. SQLite `PRAGMA user_version` matches the manifest.
8. Required tables exist.
9. At least one recipe row exists.

If any step fails, the existing local SQLite database remains active.

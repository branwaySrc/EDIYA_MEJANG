# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# EDIYA_MEJANG Project Notes

## Product Direction

- Build a light-mode-only Expo SDK 57 app for EDIYA Wolpi branch operations.
- Use Expo Router.
- Primary color: EDIYA blue `#004B93`.
- Secondary color: Tailwind `slate-600`.
- Default text is black. Text/icons on primary or highlighted backgrounds are white.
- Use Inter only, with regular and bold weights.

## Development Rules

- Do not use `elevation`.
- Keep edits narrow and follow existing folder patterns.
- Prefer shared UI primitives before creating one-off components.
- Do not revert user-created changes.
- Do not restore removed Expo template files unless required for a real app asset.
- Confirm Expo SDK 57 docs before modifying Expo-specific config or native-facing APIs.
- Never expose a Supabase `service_role` or secret key in the Expo client.

## Folder Conventions

- `src/app`: Expo Router pages and route groups.
- `src/components/base`: low-level reusable primitives.
- `src/components/ui`: reusable UI patterns.
- `src/components/global`: app-wide layout/header/drawer components.
- `src/components/features`: feature-specific components.
- `src/constants`: theme and route constants.
- `src/database`: app-facing data types, mappers, and local sample/fallback data.
- `src/lib`: pure utility/repository/cache logic.
- `src/store`: Zustand stores and app state.
- `supabase/schema`: SQL drafts/prompts for Supabase setup.

## Shared Components

- `AppText`: Inter text abstraction. Sizes are `Xs`, `Sm`, `Base`, `Lg`, `Xl`; minimum 11px and grows by 3px.
- `AppIcon`: Ionicons wrapper. Defaults to pressable behavior; `pressable={false}` renders a plain icon.
- `AppPressable`: press feedback, optional border, radius `base` = 4px, `full` = 999px.
- Reuse `AppBadge`, `AppSpacer`, `AppHeader`, `AppLayout`, `SearchBox`, and `UnderlineTabMenu`.
- `AppLayout` handles safe-area behavior, including bottom safe area.
- Global footer was removed. Do not re-add it globally.

## Route Structure

- `(home)`: home, search, settings.
- `(admin)`: WebView admin pages for delivery/platform sites.
- `(payment)`: prepaid customer management.
- `(employee)`: employee information, attendance calendar, logs, statistics, manual/tutorial.
- `(etc)`: updates, notices, tutorial, and related pages.
- `sajang`: owner-only area. Re-entering this area should route through the passcode screen.

## UI / Feature Notes

- Navigation drawer has grouped sections and special CTA buttons:
  - `사장님 이게 없어요`
  - `사장님 공간`
- Drawer opens from the left with a dimmed backdrop and closes when tapping outside.
- Hamburger animates into a back arrow while the drawer is open.
- Home tabs are `저장`, `음료`, `베이커리`, `이벤트`.
- Home tab active state uses an animated underline. No rounded tab buttons.
- Home, admin, and attendance tabs reuse `UnderlineTabMenu`; the home tab design is the canonical source.
- Search uses `SearchBox` from `src/components/ui/search`.
- Chosung search logic lives in `src/lib/chosung-search.ts`.
- Search results are capped at 4 and highlight matched text in blue/bold.
- Native keyboard should be dismissed when tapping search result items.
- App toast/popup messages should appear near the top and remain visible above the native keyboard.

## Sajang Access Model

- Sajang passcode is configured through `EXPO_PUBLIC_SAJANG_PASSCODE`.
- The Sajang keypad is custom, not the native numeric keyboard.
- Current deployment is a store-only trusted-client model:
  - Sajang screens are gated by local passcode.
  - Expo uses the Supabase publishable/anon key.
  - Supabase currently cannot distinguish Sajang vs employee requests at DB/JWT level.
- Therefore, “Sajang-only write” is currently enforced by app routing/UI, not by perfect DB authorization.
- Long-term hardening should use Supabase Auth with `app_metadata`/JWT role claims such as `app_role: 'sajang' | 'employee'`.
- Until Auth is introduced, do not claim RLS can fully enforce Sajang-vs-employee separation.

## Supabase Rules

- For Supabase work, check current Supabase guidance/changelog when behavior could have changed.
- Enable RLS on public tables exposed to the Data API.
- Explicitly grant Data API table privileges to `anon`/`authenticated` when the Expo client must access a table.
- Remember: RLS controls rows; `GRANT`/Data API exposure controls table access.
- `UPDATE` policies need a matching `SELECT` policy and both `USING` and `WITH CHECK`.
- Prefer `security invoker`; do not use `security definer` to bypass permissions.
- Keep Storage object operations in the Storage API. Do not mutate `storage.objects` directly.
- Storage upload/replacement policies commonly need `SELECT`, `INSERT`, and `UPDATE`.
- After schema changes, include `notify pgrst, 'reload schema';`.
- Schema drafts currently live under `supabase/schema/`.

## Content Data Architecture

- Sajang content management screens are the source-of-truth editing surface for:
  - recipe menus;
  - integrated find/search entries;
  - notices;
  - employee manuals;
  - tutorials;
  - vendors.
- Sajang writes source data directly to Supabase.
- Employee-facing recipe menus, recipe search, and integrated search read from a versioned JSON + image cache under the app document directory.
- Treat local device cache as read-optimized cache, not source of truth.
- Do not reintroduce SQLite or SQLite pack manifests for recipe/search caching.
- Do not keep built-in recipe/search seed constants; recipe/search content starts empty until synced.

### Recipe / Integrated Search Cache

- Sajang uploads recipe/search images to the public `recipe-content` Storage bucket and stores object paths in source JSON.
- Settings update action fetches published Supabase rows, downloads referenced images into a staging generation, validates it, then switches the active pointer.
- If sync fails, keep the previous active cache generation and report failure.
- Employee-facing screens read the active cache generation through Zustand memory state.
- Use `draft` / `published` / `archived` states so unfinished Sajang edits do not appear in employee-facing packs.

### Notices / Manuals / Tutorials

- Supabase table: `managed_content_documents`.
- Content types: `notice`, `manual`, `tutorial`.
- The app fetches only `status = 'published'` rows.
- Sajang create/update uses upsert.
- Sajang delete is soft-delete via `status = 'archived'`; do not hard-delete by default.
- Content body lives in `payload` JSON, with searchable top-level fields (`title`, `description`, `keywords`, `shift_group`, etc.).
- Normalize remote `keywords` defensively to `string[]` before rendering.
- Images are uploaded to the public `recipe-content` bucket under `managed-content/{type}/{id}/...`.
- Store image object paths in payload/section data; resolve public URLs at read time.

### Vendors

- Supabase table: `vendors`.
- Sajang is the only app UI that registers/updates vendors.
- Vendor read screens hydrate from Supabase and can retain local Zustand data as fallback.
- Use `status = 'active' | 'archived'` rather than destructive deletion.
- Current store id default is `wolpi` unless a future multi-store model replaces it.

## Paid Customers

- Paid customer data has Supabase-ready types under `src/database/paid`.
- Model prepaid balances as customer master rows plus append-only ledger rows:
  - `paid_customers` stores profile fields and denormalized `current_balance`.
  - `paid_ledger_entries` stores opening balance, charge, usage, refund, correction, and void records.
  - Every money movement must preserve `balance_before`, `amount_delta`, `balance_after`, `business_date`, and `occurred_at`.
- Do not update prepaid balances without also creating a ledger entry.
- Prefer an atomic Supabase RPC or database transaction for balance changes.
- Do not grant delete access to prepaid ledger rows from the Expo client.
- Use reversal/void rows for corrections.
- Receipt images use Supabase Storage and should be viewed via signed/public URL flow appropriate to the configured bucket.

## Employee Management

- Employee records are still app-local until the employee Supabase migration is implemented.
- `src/store/employee-management-store.ts` persists employee and document metadata to app-local file storage; keep its CRUD surface stable.
- `src/database/employee/employee.type.ts` defines Supabase-ready DTOs:
  - `EmployeeRecord` for future `employees`;
  - `EmployeeDocumentRecord` for future `employee_documents`.
- Employee work time is stored as integer `work_start_minutes` and `work_end_minutes`; `workTime` is derived UI text.
- Do not reintroduce `@react-native-community/datetimepicker` without shipping a new native APK.
- Public employee cards under `(employee)` are intentionally non-interactive.
- Only `src/app/sajang/employees.tsx` passes employee card press handlers.
- Owner-only employee detail route: `src/app/sajang/employees/[employeeId].tsx`.
- Employee documents/account details are sensitive. Future Supabase storage should use owner authentication, private buckets, and RLS.
- Recommended employee document path: `{store_id}/{employee_id}/{document_id}/{file_name}`.
- `expo-document-picker` is loaded only when upload is pressed; older custom APKs may need a rebuild before document selection works.

## Attendance

- Attendance uses Korea Standard Time for today highlighting.
- Attendance calendar/log/statistics still derive from sample/local records in several modules.
- Attendance renders Sunday-first two-week month segments (`#1`, `#2`, `#3`) by default.
- The full month calendar is a separate employee Stack screen.
- Attendance mutations live in `src/store/attendance-store.ts`.
- Attendance and substitute registration/cancellation must update calendar, logs, and statistics together.

## Hiring

- Hiring Page 01 stores `phone` and `phonePublic`.
- Employee cards always label the field `연락처`; public contacts show phone number and private contacts show `카카오톡`.
- Hiring Page 05 uses separate start/end time selectors and persists numeric minutes.
- Completing hiring upserts into `employee-management-store` and links the generated contract through the same `employeeId`.
- Sajang hiring flow generates a local PDF and opens email sharing; future Supabase storage fields are kept in the model.
- Owner contact is fixed at `010-4514-7173`.

## Build Notes

- Android package: `com.branway.ediyamejang`.
- `eas.json` preview profile builds an internal APK.
- Required app assets:
  - `assets/images/app-icon.png`
  - `assets/images/splash-logo.png`
- Keep splash/icon config pointed at existing assets.
- Last known successful APK build:
  - `https://expo.dev/accounts/branway/projects/ediyamejang/builds/abba91ee-dbeb-4a4f-8b31-f190d4a8ff6e`

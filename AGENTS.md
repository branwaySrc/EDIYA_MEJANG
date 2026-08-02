# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# EDIYA_MEJANG Project Notes

## Product Direction

- Build a light-mode-only Expo app for EDIYA Wolpi branch operations.
- Use Expo SDK 57 and Expo Router.
- Primary color is EDIYA blue: `#004B93`.
- Secondary color follows Tailwind `slate-600`.
- Default text is black. Text/icons on primary or highlighted backgrounds are white.
- Use Inter only, with regular and bold weights.

## Development Rules

- Do not use `elevation`.
- Do not restore removed Expo template files unless they are required for a real app asset.
- Keep edits narrow and follow existing folder patterns.
- Prefer shared UI primitives before creating new one-off components.
- Do not revert user-created changes.
- Confirm Expo SDK 57 docs before modifying Expo-specific config or native-facing APIs.

## Folder Conventions

- `src/app`: Expo Router pages and route groups.
- `src/components/base`: low-level reusable primitives.
- `src/components/ui`: reusable UI patterns such as search boxes and item rows.
- `src/components/global`: app-wide layout/header/drawer components.
- `src/components/features`: feature-specific components.
- `src/constants`: theme/color constants.
- `src/database`: schema and sample data.
- `src/lib`: pure utility logic such as chosung search.
- `src/store`: Zustand stores and app state.

## Shared Components

- `AppText`: Inter text abstraction. Sizes are `Xs`, `Sm`, `Base`, `Lg`, `Xl`; minimum 11px and grows by 3px.
- `AppIcon`: Ionicons wrapper. Defaults to pressable behavior; `pressable={false}` renders a plain icon.
- `AppPressable`: press feedback, optional border, radius `base` = 4px, `full` = 999px.
- `AppBadge`, `AppSpacer`, `AppHeader`, `AppLayout` are shared building blocks.
- `AppLayout` handles safe-area behavior, including bottom safe area.
- Global footer was removed. Do not re-add it globally.

## Route Structure

- `(home)`: home, search, settings.
- `(admin)`: WebView admin pages for delivery/platform sites.
- `(payment)`: prepaid customer management.
- `(employee)`: employee information, attendance calendar, logs, and statistics.
- `(etc)`: updates, notices, tutorial, and related pages.
- `sajang`: owner-only area. Re-entering this area should route through the passcode screen.

## Feature Notes

- Navigation drawer has grouped sections and special CTA buttons:
  - `사장님 이게 없어요`
  - `사장님 공간`
- Drawer opens from left with dimmed backdrop and closes when tapping outside.
- Hamburger animates into a back arrow while the drawer is open.
- Home tabs are `저장`, `음료`, `베이커리`, `이벤트`.
- Home tab active state uses an animated underline. No rounded tab buttons.
- Home, admin, and attendance tabs reuse `UnderlineTabMenu`; the home tab design is the canonical visual and animation source.
- Search uses `SearchBox` from `src/components/ui/search`.
- Chosung search logic lives in `src/lib/chosung-search.ts`.
- Search results are capped at 4 and highlight matched text in blue/bold.
- Saved recipes are stored through Zustand and reflected in the saved tab.
- Delivery/order admin uses one active WebView with header reload, site tabs, and bottom back/forward controls.
- Admin credentials panel is a bottom floating panel with text-based `복사하기` controls.
- Paid customer data has dedicated Supabase-ready types under `src/database/paid`.
- Prepaid balances must be modeled as customer master rows plus append-only ledger rows:
  - `paid_customers` stores profile fields and denormalized `current_balance`.
  - `paid_ledger_entries` stores every opening balance, charge, usage, refund, correction, and void record.
  - Every money movement must preserve `balance_before`, `amount_delta`, `balance_after`, `business_date`, and `occurred_at`.
- Do not update prepaid balances without also creating a ledger entry. Prefer an atomic Supabase RPC or database transaction for balance changes.
- Do not grant delete access to prepaid ledger rows from the Expo client. Use reversal/void rows for corrections.
- Attendance uses Korea Standard Time for today highlighting and derives calendar/statistics views from sample records in `src/database/employee`.
- Attendance renders Sunday-first two-week month segments (`#1`, `#2`, `#3`) by default; the full month calendar is a separate employee Stack screen.
- Attendance mutations live in `src/store/attendance-store.ts`; attendance and substitute registration/cancellation must update calendar, logs, and statistics together.
- Sajang passcode is configured through `EXPO_PUBLIC_SAJANG_PASSCODE`; the keypad is custom, not the native numeric keyboard.
- Sajang hiring flow generates a local PDF and opens email sharing, with future storage fields kept in the data model.

## Employee Management

- `src/database/employee/employee.type.ts` defines Supabase-ready row DTOs:
  - `EmployeeRecord` maps to a future `employees` table.
  - `EmployeeDocumentRecord` maps to a future `employee_documents` table.
  - Stored DTO fields use snake_case; UI-facing `Employee` fields are mapped in `src/database/employee/employee.ts`.
- Employee work time is stored as integer `work_start_minutes` and `work_end_minutes`, not a display string. `workTime` is a derived UI value.
- Do not reintroduce `@react-native-community/datetimepicker` without also shipping a new native APK. The current `TimeField` is a pure React Native modal so it works with the already-installed APK.
- `src/store/employee-management-store.ts` currently persists employee and document metadata to app-local file storage. Keep its CRUD surface stable so a future Supabase repository can replace the local implementation.
- Hiring Page 01 stores `phone` and `phonePublic`. Employee cards always label the field `연락처`; public contacts show the phone number and private contacts show `카카오톡`.
- Hiring Page 05 uses separate start/end time selectors and persists numeric minutes.
- Completing hiring upserts the employee into `employee-management-store` and links the generated contract through the same `employeeId`.
- The owner contact is fixed at `010-4514-7173`.
- Public employee cards under `(employee)` are intentionally non-interactive. Only `src/app/sajang/employees.tsx` passes card press handlers.
- Owner-only employee detail route: `src/app/sajang/employees/[employeeId].tsx`.
- Employee detail supports:
  - Basic and work information editing.
  - Contact visibility editing.
  - Bank name/account storage; saved account numbers become read-only with copy/edit actions.
  - Generated contract display by `employeeId`.
  - PDF/image uploads with filename and upload date.
  - Confirmed document deletion.
- Uploaded files currently live under the app document directory; metadata includes nullable `storage_bucket` and `storage_path` fields for Supabase Storage migration.
- `expo-document-picker` is loaded only when the upload action is pressed. A custom APK built before this dependency was added may require a new APK before document selection works.

## Supabase Handoff

- Supabase is not yet the source of truth. Local Zustand/file stores remain active until the backend connection is implemented.
- Planned relational tables:
  - `stores`
  - `employees` with `store_id`
  - `employee_documents` with `employee_id`
  - `employment_contracts` with `employee_id`
- Preserve UUID-compatible string IDs and ISO timestamps (`created_at`, `updated_at`, `uploaded_at`) when creating Supabase migrations.
- Employee documents and account details are sensitive. Use owner authentication, private tables/buckets, and RLS; never expose a service-role key in the Expo client.
- Use a private Storage bucket for employee documents. Recommended object path: `{store_id}/{employee_id}/{document_id}/{file_name}`.
- Storage replacement/upsert policies need `SELECT`, `INSERT`, and `UPDATE`; deletion also needs `DELETE`.
- Add indexes for `employees.store_id`, `employee_documents.employee_id`, and `employment_contracts.employee_id`.
- Keep Storage object operations in the Storage API. Do not mutate `storage.objects` directly.
- Attendance screens still read `sampleEmployees` in several modules. Before Supabase becomes the source of truth, migrate attendance calendar/log/statistics selectors to the employee repository/store.
- When Supabase is connected, migrate existing local employee records, uploaded files, and hiring contract metadata before switching reads to remote data.

## Content Data Architecture

- Sajang content management screens are the source-of-truth editing surface for recipe menus and integrated search entries.
- Sajang must read and write recipe/search management data directly from Supabase, not from the employee-facing SQLite cache.
- For the current store-only deployment model, Sajang recipe/search source tables may be accessed with the Expo publishable/anon key after the local Sajang passcode gate. Do not introduce a service-role key in the Expo client.
- Employee-facing recipe menus, recipe search, and integrated search should read from local SQLite for fast offline-first lookup.
- Treat the local SQLite database as a read-optimized cache, not as the source of truth.
- Recipe and integrated-search updates currently use SQLite cache sync:
  - Sajang edits source content directly in Supabase.
  - Employee-facing screens keep reading the local SQLite cache.
  - The settings screen recipe update action fetches published Supabase source rows, overwrites the local SQLite cache in a transaction, then reloads recipe/search state.
  - If sync fails, keep the existing SQLite cache and report the update failure.
- Keep the older versioned SQLite pack files/manifest code as a future scaling option, but do not make it the default path unless the app needs versioned file distribution later.
- Do not keep built-in recipe/search seed constants. Recipe and integrated-search content should start empty locally until the app syncs Supabase source rows into the SQLite cache.
- Use draft/published/archived states for Supabase-managed recipe and search content so unfinished Sajang edits do not appear in employee-facing packs.

## Build Notes

- Android package: `com.branway.ediyamejang`.
- `eas.json` preview profile builds an internal APK.
- Required app assets:
  - `assets/images/app-icon.png`
  - `assets/images/splash-logo.png`
- A previous EAS build failed because `splashscreen_logo` referenced a deleted template asset. Keep splash/icon config pointed at existing assets.
- Last successful APK build:
  - `https://expo.dev/accounts/branway/projects/ediyamejang/builds/abba91ee-dbeb-4a4f-8b31-f190d4a8ff6e`

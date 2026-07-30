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
- Paid customer data has dedicated types for future Firebase/Supabase integration.
- Attendance uses Korea Standard Time for today highlighting and derives calendar/statistics views from sample records in `src/database/employee`.
- Attendance renders Sunday-first two-week month segments (`#1`, `#2`, `#3`) by default; the full month calendar is a separate employee Stack screen.
- Attendance mutations live in `src/store/attendance-store.ts`; attendance and substitute registration/cancellation must update calendar, logs, and statistics together.
- Sajang passcode is configured through `EXPO_PUBLIC_SAJANG_PASSCODE`; the keypad is custom, not the native numeric keyboard.
- Sajang hiring flow generates a local PDF and opens email sharing, with future storage fields kept in the data model.

## Build Notes

- Android package: `com.branway.ediyamejang`.
- `eas.json` preview profile builds an internal APK.
- Required app assets:
  - `assets/images/app-icon.png`
  - `assets/images/splash-logo.png`
- A previous EAS build failed because `splashscreen_logo` referenced a deleted template asset. Keep splash/icon config pointed at existing assets.
- Last successful APK build:
  - `https://expo.dev/accounts/branway/projects/ediyamejang/builds/abba91ee-dbeb-4a4f-8b31-f190d4a8ff6e`

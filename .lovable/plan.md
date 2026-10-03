# Polish release: offline, CSV, Arabic/RTL, accessibility, empty states, tests, privacy

## 1. Installable app with offline reading
- Add an app manifest and icons in teal, so the app can be added to the home screen.
- Offline reading uses `vite-plugin-pwa` (generateSW), registered only in the published app. It never runs in the editor preview, and `?sw=off` switches it off.
- Saved data stays readable offline because recent screens are kept on the device. The app does not save new entries while offline.
- A calm banner appears when offline: "You're offline — showing your last saved data. Changes are paused until you reconnect."

## 2. CSV export and import
- Settings > Data: "Export transactions" and "Export goals" download CSV files. Fields are quoted safely, and names with `= + - @` get a leading quote so spreadsheets don't run them as formulas.
- Import takes 3 steps:
  1. Upload the file.
  2. Match its columns to date, category, amount, account and note.
  3. Preview the rows. Each row is marked OK, Unknown category (exact name match) or Invalid (bad date or amount, or outside the 24-month window).
- Only valid rows are imported. You can also skip rows or map unknown categories to an existing category. The 1,500-row cap is respected.

## 3. English and Arabic with full RTL
- Add a small built-in translation layer (no outside services). All interface text goes into English and Arabic dictionaries.
- A language picker in Settings saves to `profiles.locale`. Arabic sets `dir="rtl"` and `lang="ar"` on the page.
- Fix the remaining left/right spacing so layouts mirror correctly, and flip arrow icons. Numbers and money use the locale's formatting.
- The Arabic text is my own translation. A native speaker should review it.

## 4. Accessibility pass
- Every input has a label and every icon-only button has an aria-label.
- All interactive controls get a visible focus ring.
- Check text contrast in light and dark mode and fix muted or gold text that falls below WCAG AA.
- Text sizes switch from fixed px to rem so the layout scales with the browser or phone text size (tested at 200%).
- Respect the reduced-motion setting.

## 5. Empty states and skeleton loading
- Add a shared `EmptyState` with a mint icon tile, a short message and an action, plus a `PageSkeleton`.
- Use them on every page that loads data.

## 6. Unusual-input tests (Vitest)
- Very long names (category name of 40 or more characters, account name of 30 or more).
- Emoji and Arabic names, matched exactly.
- Duplicate names, matched case-sensitively.
- Text in number fields ("abc", "1,2,3", empty), which are rejected through a shared `parseAmount`.
- An invalid selected month falls back to month 1 and is flagged by the health check.
- CSV parsing and formula escaping.

## 7. Privacy and security check
- A test scans the source code and dependencies for analytics or tracker packages and domains (Google Analytics, Segment, Mixpanel, Sentry, Hotjar and similar), and fails if any is found.
- A row-level security script signs in as two temporary users. User B tries to read and update user A's rows in every table, and the script confirms nothing comes back. It cleans up afterwards. It runs once now and is kept as a manual check.

## Technical notes
- New code goes in `src/lib/i18n/`, `src/lib/csv.ts` (pure functions plus tests), `src/components/EmptyState.tsx`, `src/components/OfflineBanner.tsx` and `src/lib/pwa-register.ts`.
- The engine stays pure, and imported rows go through the existing data layer and the database caps.
- Rules are recorded in AGENTS.md.

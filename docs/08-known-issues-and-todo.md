# Known issues and to-do

## Bugs

None open in the engine. All `docs/test-scenario.md` checks pass in `src/lib/engine/scenario.test.ts`. The last fixed bug was one-time recurring payments being counted in the monthly total (`recurringTotals` in `src/lib/engine/index.ts`).

## Limitations

- **Transaction list cap:** `transactionsQuery` loads only the latest 2,000 transactions (`src/lib/data.ts`). The database cap is 1,500, so this doesn't matter today.
- **Archive viewer:** archived entries from "Start a new year" are kept but cannot be viewed (no screen reads `archived_entries`).
- **Zakat after a new year:** set-aside amounts from before the reset no longer count. Interest records are not archived.
- **Exports:** CSV export covers only transactions and goals (`src/lib/csv.ts`).
- **Sample data:** there is no bulk-delete for sample data, apart from the developer Reset in the preview.
- **Offline:** read-only offline. Writes are not queued.

## Unfinished

- **Arabic:** page body text, card labels, charts and messages are still English (`roadmap.md`). The Arabic in `src/lib/i18n/ar.ts` needs review by a native speaker.
- **Accessibility:** a full audit of every form's labels and a large-text test are still to do.

## Differences from the scenario or principles

- **Today's date:** the scenario assumes today is 3 Oct 2026. Live screens use the real date, so "days until" figures shift.
- **Auth settings** (auto-confirm, HIBP off, 6-char minimum) are below production standard. They were set on purpose for testing.

## Housekeeping

- Two throwaway RLS-check users and the test account remain in the auth user list.
- `.env` was committed before it was added to `.gitignore`. It holds public values only.

## Suggested next steps (most important first)

1. Turn email confirmation and the leaked-password check back on, and raise the minimum password length, before inviting real users.
2. Add automated end-to-end tests: sign up, onboarding, add transaction, Tracker numbers.
3. Add a full-data export (all tables) for user backups.
4. Finish the Arabic translation and get it reviewed by a native speaker.
5. Add a viewer for archived years.
6. Run the accessibility audit (labels, large text).
7. Clean up the test users. Optionally take `.env` out of version control.

## Unverified

- I haven't checked the published app on a real phone install (PWA) recently.

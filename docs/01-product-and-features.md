# Product and features

## Who it is for

Muslims who want a calm, interest-free way to plan a monthly budget, save for goals with cash, and track Zakat and interest purification. It is usable by anyone. It is mobile-first, with a fast "add transaction".

## Principles (as implemented)

| Principle | Where it shows in code |
|---|---|
| No interest features: no credit cards, EMI or interest loans; big purchases are cash goals | No such tables exist (`supabase/migrations/*.sql`). Goals are cash goals (`src/routes/_authenticated/_app/goals.tsx`). |
| Scholar disclaimer on Zakat/interest screens | `src/components/Disclaimer.tsx`, used in `zakat.tsx` and `interest.tsx` |
| Transparent math; estimates labelled | Tracker notes that carry-out is an estimate until the month ends (`tracker.tsx`); every rule lives in `src/lib/engine` |
| Privacy first: no ads, analytics or trackers | Enforced by `src/test/privacy.test.ts` |
| Forgiving: explain mistakes | Health Check (`healthChecks` in `src/lib/engine/extras.ts`, `health.tsx`); friendly errors (`friendlyError` in `src/lib/data.ts`) |
| Light/dark, RTL, keyboard accessible | `src/components/ThemeToggle.tsx`, `src/lib/i18n`, focus styles in `src/styles.css` |

## Screens

All signed-in screens are in `src/routes/_authenticated/_app/`.

| Screen | Route | What it does |
|---|---|---|
| Welcome | `/` (`src/routes/index.tsx`) | Landing page with "Get started" and "Open my planner" (both go to `/auth`) |
| Sign in / up | `/auth` (`src/routes/auth.tsx`) | Email and password |
| Onboarding | `/onboarding` | Name, currency, first plan month |
| Dashboard | `/dashboard` | Income received, spent excl. savings, saved, left, savings rate; goal progress; alerts; planned-vs-actual by type; 12-month trend (Year 1/Year 2); setup checklist (`SetupChecklist.tsx`) |
| Add | `/add` | Full-page transaction form (`TransactionForm.tsx`) |
| Quick Add | floating `+` on every app screen (`QuickAdd.tsx`) | Bottom sheet: keypad, category, account, date (defaults to today), note, "Save and add another" |
| Log | `/log` | Search, filter by month and category, edit/delete; negative amounts allowed |
| Budget | `/budget` | Income sources and categories with inline editing; totals; Unallocated turns red when over-allocated |
| Tracker | `/tracker` | Per-category planned, carry-in, available, actual, remaining, % used, status, carry-out |
| Income | `/income` | Income entries by month, received vs expected |
| Goals | `/goals` | Target, opening, saved from log, auto-counted, total, remaining, progress, monthly plan, months to go, estimated completion, auto-count switch, priority |
| Accounts | `/accounts` | Calculated vs actual balance, difference, usable above minimum; transfers |
| Recurring | `/recurring` | Next due, days until, status, monthly set-aside, due in selected month, total monthly equivalent |
| Zakat | `/zakat` | Silver/Gold basis, user-entered metal prices, assets/liabilities (account balances added automatically), results, disclaimer |
| Interest | `/interest` | Received, given away, waiting to give; disclaimer |
| Health Check | `/health` | Fix / Note / OK checks, each linking to the problem page |
| More | `/more` | Secondary navigation plus enabled planners |
| Settings | `/settings` | Profile, currency, plan start, theme, language, CSV import/export, Modules, Start a new year, sign out; Developer and Danger zone in preview only (`DevTools.tsx`) |
| Ramadan / Qurbani / Hajj & Umrah | `/ramadan`, `/qurbani`, `/hajj` | Shared `PlannerPage.tsx`: dates, items (planned/spent), months until, monthly set-aside |

Other capabilities:
- **Sample data:** `SampleDataCard.tsx` + `src/lib/sample-data.ts`.
- **CSV:** `src/lib/csv.ts`, Settings → Data.
- **Offline / installable:** `src/lib/pwa-register.ts`, `OfflineBanner.tsx`.
- **English/Arabic:** `src/lib/i18n`.
- **Start a new year:** `SettingsExtras.tsx` → `start_new_year` database function.

## Limits

| Item | Limit | Enforced in |
|---|---|---|
| Categories | 50 | DB trigger `categories_limit`; `LIMITS` in `src/lib/engine/extras.ts` |
| Income sources | 5 | DB trigger |
| Income entries | 300 | DB trigger |
| Transactions | 1,500 | DB trigger; CSV import checks the cap too |
| Goals | 10 | DB trigger |
| Accounts | 10 | DB trigger |
| Recurring items | 50 | DB trigger |
| Plan window | 24 months from plan start | `PLAN_MONTHS` in `src/lib/engine/index.ts` |
| Category name | 40 chars, unique, not "Same category"/"Drop it" | `src/lib/budget-rules.ts` + DB constraints |
| Account name | 30 chars, unique | `src/lib/budget-rules.ts` |

## Optional

- **Ramadan, Qurbani and Hajj/Umrah planners:** hidden unless switched on in Settings → Modules (`profiles.modules`, all off by default).
- **Auto-count monthly plan** for a goal (off by default).
- **Actual balance** per account.
- **Goal link and notes** on a category.

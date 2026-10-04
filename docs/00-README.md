# Halal Budget Planner — documentation

## What it is

Halal Budget Planner is a privacy-respecting monthly budgeting web app for Muslims, though anyone can use it. You plan income against categories and log transactions, and leftover money carries forward automatically under explicit rules. It also covers savings goals, accounts and transfers, recurring payments, Zakat, purifying interest received, and optional Ramadan, Qurbani and Hajj/Umrah planners. It has no interest-based features, ads or trackers. Every figure is calculated live from your raw entries (`src/lib/engine`) and never stored.

## Index

| File | Contents |
|---|---|
| [01-product-and-features.md](01-product-and-features.md) | Features, screens, principles, limits, optional modules |
| [02-architecture.md](02-architecture.md) | Stack, folders, routing, data flow, components, dependencies |
| [03-calculation-engine.md](03-calculation-engine.md) | Every engine function and rule, with worked examples |
| [04-backend-and-database.md](04-backend-and-database.md) | Ownership, SQL, ER diagram, auth settings, env vars, recreate checklist |
| [05-auth-and-security.md](05-auth-and-security.md) | Sign-in flow, sessions, RLS, threat checklist |
| [06-deployment.md](06-deployment.md) | Build, hosting, static hosting, backups |
| [07-testing.md](07-testing.md) | Test files, how to run, scenario, developer helpers, gaps |
| [08-known-issues-and-todo.md](08-known-issues-and-todo.md) | Bugs, limitations, next steps |
| [test-scenario.md](test-scenario.md) | Reference scenario with expected numbers |
| [ui-inventory.md](ui-inventory.md) | Screens, states, navigation, design tokens |
| [backend-setup.md](backend-setup.md) | Short backend recreation guide (superset in 04) |

## Run it locally

Requires [Bun](https://bun.sh) (the repo uses `bun.lock`; npm also works).

```bash
bun install
# create .env with the three VITE_ variables below
bun run dev        # Vite dev server (http://localhost:8080 in the Lovable sandbox; Vite default otherwise)
bun run test       # Vitest, all unit tests (vitest run)
bun run build      # production build (vite build)
bun run lint       # ESLint
```

Environment variables (all public; see `04-backend-and-database.md`):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Backend URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key |
| `VITE_SUPABASE_PROJECT_ID` | Project ref |

Scripts are defined in `package.json`. Optional: `bun scripts/rls-check.ts` runs the manual two-user security check.

## Current status

- All features in `01-product-and-features.md` are built. `roadmap.md` has one open item: translating the remaining page body text into Arabic.
- 103 unit tests across 10 files pass (`bunx vitest run`), and typecheck is clean.
- The app is published at `https://happy-halal-funds.lovable.app`.
- Development-only auth settings are active: no email confirmation, no leaked-password check. See `08-known-issues-and-todo.md`.

## Documentation accuracy

Checked on 4 Oct 2026 against the code, migrations, tests and configuration. No application code was changed.

### Verified

- **Routes and gates:** route list and files; sign-in gate (`_authenticated/route.tsx`, `ssr: false`, offline fallback); onboarding gate (`_app/route.tsx`); sign-in/up navigation and `emailRedirectTo` (`auth.tsx`); onboarding sets `onboarding_completed` (`onboarding.tsx`).
- **Data layer:** query keys, the 2,000-row transaction limit and `useInvalidateData` (`src/lib/data.ts`); `usePlan` inputs (`src/lib/use-plan.ts`); cache persistence key `hbp-cache`, 7-day maxAge, buster `v1`, cleared on sign-out (`__root.tsx`, `settings.tsx`); `hbp-theme` / `hbp-locale` keys.
- **Engine:** every function name, signature and rule in `03-calculation-engine.md` matches `src/lib/engine/index.ts` and `extras.ts`, including the one-time recurring fix.
- **Tests:** 10 files, 103 passing (`bunx vitest run`).
- **Database:** 15 tables (14 + `archived_entries`); 11 composite foreign keys, all `ON DELETE SET NULL`; row-limit triggers and values; RLS policies; `start_new_year` is security invoker; `handle_new_user` is the only security-definer function.
- **Navigation and design tokens** in `ui-inventory.md` match `AppShell.tsx` and `src/styles.css`.
- **Dev helpers:** `isDevEnvironment` hostnames (`src/lib/dev-tools.ts`); service-worker guards (`src/lib/pwa-register.ts`); PWA config (`vite.config.ts`).
- **Misc:** theme toggle only on `/`, `/auth` and Settings; scholar disclaimer on Zakat and Interest; password `minLength={6}` in the form; no edge functions or `createServerFn` in app code.

### Could not verify

- Live auth settings (auto-confirm, HIBP, minimum length) — taken from the earlier configuration, not read back.
- An object-by-object diff between the live database and `supabase/migrations`.
- Build output: `dist/` is not present now, so `dist/client/sw.js` was confirmed only in an earlier build.
- Static-hosting (SPA mode) steps, full-data export from Lovable Cloud, and PWA install on a real phone.
- Arabic translation quality.

### Contradictions found and fixed

- `01`: account-name validation lives in `src/lib/parse.ts`, not `budget-rules.ts`; CSV UI is in `DataCard.tsx`.
- `02`: the component map wrongly put `DataCard` on the Dashboard (it is the Settings CSV card). The dependency list claimed `react-hook-form`, `zod`, `date-fns`, `react-day-picker` and `cmdk` were used; app code imports none of them, and only 10 of the 46 shadcn primitives are used.
- `05`: CSV formula escaping also covers tab/CR and skips plain negative numbers.
- `07`: per-file counts are `it` blocks; `it.each` expands them, so they don't sum to 103.
- `06`: noted that `dist/` is not currently present.

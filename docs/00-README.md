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

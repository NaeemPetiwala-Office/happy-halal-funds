# Backend setup — Halal Budget Planner

How to rebuild this backend in a fresh Supabase project.

## Who owns the current backend

The current backend is a **Lovable Cloud** project. Lovable creates and manages it (ref `biicbbzqhkadbjhrecsg`). It is not a Supabase project in your own Supabase account. You have no Supabase dashboard access to it, and its service-role key and database password are not available to you. One instance serves both the preview and the published app.

## 1. Database (tables, constraints, indexes, triggers, RLS)

The complete SQL is in `supabase/migrations/`. Run the files in filename order:

| File | Contents |
|---|---|
| `20261003155016_…sql` | Enums; helper functions `set_updated_at`, `enforce_row_limit`, `normalize_profile_months`, `handle_new_user`; tables `profiles`, `goals`, `categories`, `accounts`, `transfers`, `income_sources`, `income_entries`, `transactions`, `recurring_items`, `zakat_settings`, `zakat_lines`, `interest_received`, `interest_given`, `module_plans`; unique and composite `(id, user_id)` foreign keys; indexes on `(user_id, date)` for transactions and income entries; grants; RLS "Own rows" (`user_id = auth.uid()`) on every table; per-user row-limit triggers; the `on_auth_user_created` trigger on `auth.users` |
| `20261003155046_…sql` | Empty file (kept so migration history matches) |
| `20261003180533_…sql` | `archived_entries` table with grants and RLS; `start_new_year(date, jsonb, jsonb)` function, executable by `authenticated` |

Run them with either:
- `supabase link --project-ref <new-ref>` then `supabase db push`, or
- paste each file into the SQL editor in order.

Row caps enforced in the database: categories 50, income sources 5, income entries 300, transactions 1500, goals 10, accounts 10, recurring items 50.

## 2. Auth settings

| Setting | Value the app relies on |
|---|---|
| Providers | **Email + password only.** No Google or other social sign-in. |
| Email confirmation | **Off** (auto-confirm). Set during development so testing is instant. Consider turning it on for production. |
| Leaked-password check (HIBP) | Off (development choice) |
| Minimum password length | 6 |
| Site URL | Your published app URL, e.g. `https://happy-halal-funds.lovable.app` |
| Redirect URLs | Sign-up sends `emailRedirectTo: <origin>/dashboard`. Add `<your-domain>/**` (and `http://localhost:8080/**` for local dev) to the allowed redirect URLs. |
| Anonymous sign-ins | Off |

A profile row is created automatically for each new user by the `handle_new_user` trigger.

## 3. Front-end environment variables

Put these in `.env` at the project root. All are public (safe in the browser).

| Variable | Where to find it (Supabase dashboard) |
|---|---|
| `VITE_SUPABASE_URL` | Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → publishable key (or legacy anon key) |
| `VITE_SUPABASE_PROJECT_ID` | Project Settings → General → Reference ID |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID` | Same values. Used only as fallbacks during server rendering. |

Never put the service-role key in `.env` or in any `VITE_` variable. The app does not use it today.

`scripts/rls-check.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

## 4. Edge functions and secrets

**None.** There are no Supabase Edge Functions and no app server functions. All data access goes straight from the browser using the publishable key, protected by RLS.

The current Lovable Cloud project lists secrets `LOVABLE_API_KEY`, `LOVABLE_CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_URL`. These are platform-managed, and no app code currently depends on them. A fresh Supabase project needs none of them.

## 5. Verification checklist

- [ ] All three migrations ran without errors; 15 tables exist in `public`.
- [ ] Every table shows RLS enabled with an "Own rows" / "Own profile" policy.
- [ ] Sign up a new user in the app → you land in onboarding (no email confirmation needed if auto-confirm is on) and a `profiles` row exists.
- [ ] Finish onboarding, click "Load test scenario" (Settings → Developer, preview only), and check that the Tracker shows August actual ₹47,100.
- [ ] Settings → "Start a new year" completes (proves `start_new_year` works).
- [ ] Insert a 51st category → it fails with "Limit reached".
- [ ] Run `bun scripts/rls-check.ts` → prints `PASS`.
- [ ] `bunx vitest run` passes.

## Things I'm not sure about

- **The migration files have not been compared object-by-object with the live database.** Tables, columns, triggers, functions and policies listed by the live project match the files, but I did not dump the live schema to diff it.
- **Email templates, rate limits, SMTP and JWT expiry** were never changed and are assumed to be Supabase defaults.
- **Auth settings** come from what was configured during this project (auto-confirm on, HIBP off). I couldn't read back every setting from the live project.
- **`supabase/config.toml`** only contains the old project ID. Replace it with the new ref when you link.
- The `on_auth_user_created` trigger is created on `auth.users`. That needs the SQL editor or the CLI with owner rights, which a normal Supabase project gives you.

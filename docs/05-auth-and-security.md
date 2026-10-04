# Auth and security

## Sign-up and sign-in (`src/routes/auth.tsx`)

- **Sign in:** `supabase.auth.signInWithPassword`, then go to `/dashboard`.
- **Sign up:** `supabase.auth.signUp` with `emailRedirectTo: origin + "/dashboard"`.
  - With auto-confirm on, a session comes back immediately and the user goes to `/onboarding`.
- **New profile:** the `handle_new_user` trigger creates the `profiles` row.
- **Onboarding** (`src/routes/_authenticated/onboarding.tsx`) saves the name, currency and plan start, then sets `onboarding_completed`.
- **Sign out** (`settings.tsx`) clears localStorage `hbp-cache`, then calls `supabase.auth.signOut()`.

## Sessions

- `src/integrations/supabase/client.ts` keeps the session in browser storage, with `persistSession` and `autoRefreshToken` on.
- `__root.tsx` subscribes once to `onAuthStateChange`.

## Protected routes

- `src/routes/_authenticated/route.tsx` (`ssr: false`) checks the user with `getUser()`, which is validated with the server.
  - When offline, it accepts the stored session so cached screens stay readable. Nothing can be written offline.
- `src/routes/_authenticated/_app/route.tsx` requires a completed onboarding.

## Row-level security

- Every table has `user_id uuid default auth.uid()` and one policy, `user_id = auth.uid()`, for `authenticated` (`supabase/migrations/*.sql`).
- Composite `(id, user_id)` foreign keys stop a row from referencing another user's data.
- `start_new_year` is security invoker, so RLS applies inside it as well.
- `handle_new_user` is the only security-definer function, and it only inserts the caller's profile.

## `scripts/rls-check.ts`

1. Signs up two throwaway users (A and B) with the publishable key and random passwords.
2. User A inserts one row into every writable table.
3. For all 15 tables, the script checks that A can see its own rows and that B cannot read, update, delete, or insert rows owned by A.
4. It deletes A's rows and exits 1 on any failure.

Run it with `bun scripts/rls-check.ts`. It needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, and it requires auto-confirm on. The last run printed PASS. The two test users remain in the auth list, with no data.

## Data stored

- **Profile:** name, currency, plan start, selected month, locale, modules.
- **Budget data:** categories, income, transactions, goals, accounts, transfers, recurring items, Zakat settings and lines, interest, planner JSON, and archived entries (old transactions, income entries and transfers kept as JSON after "Start a new year").
- **On the device:** the query cache (`hbp-cache`), theme (`hbp-theme`) and locale (`hbp-locale`) in localStorage.

## Threat checklist

| Check | Status / where |
|---|---|
| No secrets in repo | Only public keys in `.env`; `.env`, `.env.*`, `*.pem`, `*.key` in `.gitignore`. Note `.env` was committed earlier (public values only). |
| Service-role key not in front-end | Only `src/integrations/supabase/client.server.ts` references it by name; no app file imports it. |
| No trackers | `src/test/privacy.test.ts` |
| RLS on every table | Migrations + `scripts/rls-check.ts` |
| Input validation | `src/lib/budget-rules.ts`, `src/lib/parse.ts`, DB constraints and unique indexes, row-limit triggers, CSV import validation (`src/lib/csv.ts`) |
| CSV formula injection | `escapeCell` prefixes cells starting with `= + - @`, tab or CR with a quote, except plain numbers such as `-500` (`src/lib/csv.ts`) |
| Dev tools hidden in production | `isDevEnvironment` (`src/lib/dev-tools.ts`): dev build, localhost, `id-preview--*` or `*-dev.lovable.app` only |
| Weak auth settings | Auto-confirm, HIBP off and 6-char minimum. **Change before real users.** |

## Unverified

- Whether the published host could ever match `isDevEnvironment` has not been browser-tested on the published URL.

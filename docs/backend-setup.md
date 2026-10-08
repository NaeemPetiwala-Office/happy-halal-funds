# Backend setup: your own Supabase project

Region: **South Asia (Mumbai)**. Plan: **Free**. Never paste any key, password or token into a chat. Values go only into your local `.env` (git-ignored).

## 0. Prepare the repo (once)

1. Open Terminal in your cloned folder (`cd path/to/happy-halal-funds`).
2. Check tools: `git --version && node -v && npm -v`. If `node` is not found, install the LTS version from nodejs.org (it includes npm), then reopen Terminal.
3. Install dependencies: `npm install` (the repo's `.npmrc` sets `legacy-peer-deps=true`, which avoids an npm crash). This creates `package-lock.json`. Commit it later (`git add package-lock.json`).
4. Create your env file: `cp .env.example .env`. Leave it open; you fill it in at step 4.

## 1. Create the project

Dashboard: https://supabase.com/dashboard, then **New project**.
- Organization: your personal one. Name: `budgetbuddy`.
- Database password: use "Generate a password", save it in your password manager. You will not need it for these steps.
- Region: **South Asia (Mumbai)**. Plan: **Free**.
- Leave other options at their defaults (if "Enable automatic RLS" is offered, leave it on).
- Wait until the project status is "Healthy".

## 2. Apply the migrations in order

Dashboard, left menu **SQL Editor**, **New query**. Paste the full content of each file, press **Run**, and expect "Success. No rows returned". Run them strictly in this order:

1. `supabase/migrations/20261003155016_ef57a369-9274-4a9c-8507-2aff1df1263a.sql`
2. `supabase/migrations/20261003155046_1d86ba4e-dae0-4426-b69c-5cd825f9344e.sql` (a single line)
3. `supabase/migrations/20261003180533_4fbff957-3046-4f5e-a2a3-198b82a8b9ad.sql`

If a file fails, copy the **red error text** and the **file name**; do not re-run partially.

Verify (new query, run both):

```sql
select c.relname as table_name, c.relrowsecurity as rls_on
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' order by 1;
```
Expect **15 rows, all `true`**.

```sql
select tablename, policyname, roles from pg_policies where schemaname = 'public' order by 1;
```
Expect **15 rows**, every `roles` value `{authenticated}`.

## 3. Production auth settings

Dashboard, **Authentication**. Labels move between dashboard versions, so look for these names:

| Setting | Where | Set to |
|---|---|---|
| Confirm email | Sign In / Providers, Email | **On** |
| Minimum password length | Sign In / Providers, Email (or Password settings) | **10** (spec requires 8 or more) |
| Require current password when changing password | same place, if shown | **On** |
| Allow anonymous sign-ins | Sign In / Providers | **Off** |
| Other providers (Google, phone, etc.) | Sign In / Providers | **Off** |
| Leaked password protection | Email provider | **Not available on Free** (Pro plan). Documented gap. |
| Site URL | URL Configuration | `http://localhost:8080` for now. Step 4 changes it to your Firebase address. |
| Redirect URLs | URL Configuration | add `http://localhost:8080/**` and `http://localhost:5173/**` |

Notes:
- Supabase's built-in email sender is for testing only (strict rate limit). If a sign-up confirmation mail does not arrive, that is why. Custom SMTP is a Step 3/4 decision.
- Free projects **pause after 1 week without activity** and have **no automatic backups**. Log in at least weekly. Use the JSON export (added in Step 3) as your backup.
- Optional hardening after all tests pass: turn off "Allow new users to sign up" (you are the only user).

## 4. Fill in `.env`

Dashboard, **Project Settings**:
- `VITE_SUPABASE_URL`: **Project Settings, API (Data API)**, "Project URL" (looks like `https://xxxx.supabase.co`).
- `VITE_SUPABASE_PUBLISHABLE_KEY`: **Project Settings, API Keys**, the **publishable** key (starts with `sb_publishable_`). If you only see a "legacy anon" key, that also works.
- Never use the **secret** or **service_role** key anywhere in this project.

## 5. Create the two test users

**Authentication, Users, Add user, Create new user**. Create two users with different emails (for example `rls-a@example.com` and `rls-b@example.com`), a strong random password each, and tick **Auto Confirm User**. Write the four values into `.env` as `RLS_A_EMAIL`, `RLS_A_PASSWORD`, `RLS_B_EMAIL`, `RLS_B_PASSWORD`.

## 6. Run the isolation check

```
npx tsx --env-file=.env scripts/rls-check.ts
```
Expect: `PASS - user B and a signed-out client could not read, change, delete or forge user A's rows in 15 tables.`
On `FAIL`, paste the whole output (it contains no secrets).

## 7. Extra checks (SQL editor)

Row cap proof (paste output):
```sql
select tgname, tgrelid::regclass as table_name from pg_trigger
where tgname like '%\_limit' escape '\' and not tgisinternal order by 2;
```
Expect **7 rows** (categories, income_sources, income_entries, transactions, goals, accounts, recurring_items). `transfers`, `zakat_lines`, `interest_*` and `module_plans` have no cap yet; that is a known gap fixed in Step 3.

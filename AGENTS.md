<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Signed-in screens live under `src/routes/_authenticated/_app/`; the `_app` layout renders the shell and redirects to onboarding until the profile is complete — keeps gating in one place.
- Every user table carries `user_id default auth.uid()` with a single RLS policy `user_id = auth.uid()`; cross-table references use composite `(id, user_id)` foreign keys so rows can never point at another user's data.
- Per-user row caps are enforced in the database by the `enforce_row_limit(n)` trigger — limits hold even if the UI is bypassed.
- Derived numbers (carry-over, balances, Zakat, goals) are computed in `src/lib/engine` from raw rows and never stored.
- Theme is a `dark` class on `<html>` persisted in localStorage and applied by an inline head script to avoid a flash.
- Use logical spacing utilities (`ps-`, `pe-`, `ms-`, `start-`, `end-`) so RTL layouts work.
- Table reads go through shared query options in `src/lib/data.ts` (keys under `["data", ...]`); after any write call `useInvalidateData()` so every screen refreshes together.
- Screens get derived numbers via `usePlan()` (src/lib/use-plan.ts), which feeds raw rows into the engine for the globally selected month stored on the profile.
- "Start a new year" runs in one database function (`start_new_year`) that moves old entries into `archived_entries` (kept as JSON, not counted) — atomic, and archived rows never count toward row caps.
- Optional planners store their dates and items as JSON in `module_plans` (one row per module) and are visible only when the matching `profiles.modules` flag is on.

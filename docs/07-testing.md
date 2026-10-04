# Testing

## Setup

`vitest.config.ts` runs Vitest with jsdom, globals, `src/test/setup.ts`, the `@` alias, and includes `src/**/*.{test,spec}.{ts,tsx}`.

Run all tests with `bun run test` (or `bunx vitest run`). For a single file: `bunx vitest run src/lib/engine/scenario.test.ts`.

Current result: **103 tests in 10 files, all passing.**

## Test files

| File | `it` blocks | Covers |
|---|---|---|
| `src/lib/engine/engine.test.ts` | 11 | Original rule cases (a)–(g): carry chain with backdating, own negative carry, A→B→C one hop, auto-count 69,000/72,000, extra deposit 55,200, savings withdrawal, exact names; tracker status; account balances; recurring dates |
| `src/lib/engine/scenario.test.ts` | 25 | No clock reads; every number for Aug–Nov from `docs/test-scenario.md` (today 3 Oct 2026); goals; accounts; recurring; Zakat; interest; health; variants E1–E6 (E6 with today 2 Nov) |
| `src/lib/engine/rules.test.ts` | 17 | Refunds/withdrawals; leftover chain; missing destination; Drop it; special-character, emoji and Arabic names; duplicates; mid-month plan start; recurring frequencies; Zakat missing price / below / above nisab |
| `src/lib/engine/extras.test.ts` | 7 | Zakat, interest, planner totals, health checks, test-scenario fixes (bank balances, goal-below-zero note) |
| `src/lib/budget-rules.test.ts` | 7 | Category name rules |
| `src/lib/unusual-inputs.test.ts` | 11 | Long names, emoji/Arabic, duplicates, text in numbers, invalid selected month |
| `src/lib/csv.test.ts` | 5 | Formula-safe export, import preview |
| `src/lib/dev-tools.test.ts` | 3 | Test-scenario data shape |
| `src/test/app-routing.test.tsx` | 1 | App routing renders |
| `src/test/privacy.test.ts` | 2 | No tracker packages or scripts |

`unusual-inputs.test.ts` uses `it.each`, so its 11 blocks expand to more tests. The total, as reported by Vitest, is 103.

The fixture is `src/lib/engine/scenario.fixture.ts`.

## Browser tests

There are **no committed browser tests**. Screens were checked ad hoc with Playwright scripts kept outside the repo, under `/tmp/browser/`. Screenshots are described in `docs/ui-inventory.md`. The manual security check is `bun scripts/rls-check.ts` (see 05).

## Test scenario

`docs/test-scenario.md` (currency ₹, plan start 1 Aug 2026) lists the setup data and the expected numbers. It is used in two places:
1. Encoded in `scenario.fixture.ts` and asserted in `scenario.test.ts`.
2. Loaded into a real account by the "Load test scenario" developer helper.

## Developer helpers (`src/lib/dev-tools.ts`, `src/components/DevTools.tsx`)

These are visible only when `isDevEnvironment()` is true: a dev build, localhost, `id-preview--*` or `*-dev.lovable.app`.

- **Settings → Developer → Load test scenario.** After confirmation, it wipes the user's data and inserts the scenario, setting ₹ and plan start Aug 2026. Running it twice gives the same result.
- **Settings → Danger zone → Reset all my data.** You must type RESET. It deletes every row the user owns, in foreign-key-safe order, but keeps the account and profile.

## Known gaps

- No automated browser or end-to-end tests. No tests for components or forms beyond routing.
- The RLS check is manual and not part of `vitest`.
- No tests for `start_new_year`, the CSV import write path, offline behaviour or Arabic/RTL layout.
- The goal-below-zero warning is unit-tested but has not been seen on screen.

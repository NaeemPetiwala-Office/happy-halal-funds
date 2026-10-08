# Calculation engine

Source: `src/lib/engine/index.ts` and `src/lib/engine/extras.ts` (re-exported). The engine is pure: it does no I/O and never reads the clock. Every date-dependent function takes `today` (`YYYY-MM-DD`). `src/lib/engine/scenario.test.ts` fails if a bare `new Date()` or `Date.now()` appears in the engine. Results are never stored.

## Functions

| Function | Inputs | Output | Takes `today` |
|---|---|---|---|
| `monthIndex(planStart, date)` | dates | month offset (may be <0 or ≥24) | no |
| `normalizePlanStart(date)` | date | 1st of that month | no |
| `monthKey(planStart, k)` | | `YYYY-MM` | no |
| `monthEnd(planStart, k)` | | 1st of month k+1 | no |
| `findCategoryByName(cats, name)` | | exact literal match | no |
| `targetOf(cat, ids)` | | destination id or null | no |
| `computePlan({planStart, today, categories, transactions, goals})` | raw rows | `Plan` (cells per category × 24 months) | **yes** |
| `statusOf(available, actual, remaining, pct)` | | `Status` | no |
| `trackerRows(plan, k)` | | `TrackerRow[]` | via plan |
| `monthSummary(plan, k, incomeEntries, plannedIncome)` | | `MonthSummary` | no |
| `goalTotals(plan, goals, transactions)` | | `GoalTotal[]` | via `plan.today` |
| `accountTotals(accounts, incomeEntries, transactions, transfers)` | | `AccountTotal[]` | no |
| `recurringStepMonths(freq)` | | 1/3/6/12/0 | no |
| `nextRecurringDue(item, today)` | | date or null | **yes** |
| `recurringDueInMonth(item, selectedMonth)` | | boolean | no |
| `recurringTotals(items, today, selectedMonth)` | | `RecurringTotal[]` | **yes** |
| `monthAlerts(plan, k, summary, goals)` | | `Alert[]` | no |
| `resolveSelectedMonth(planStart, selected)` | | `{k, valid}`; invalid → k 0, flagged | no |
| `shiftMonths(date, n)` (extras) | | date | no |
| `zakatCalc(input)` (extras) | includes `today` | `ZakatResult` | **yes** (in input) |
| `interestTotals(received, given)` | | received/given/waiting | no |
| `plannerTotals(data, today)` | | planned/spent/remaining/monthsUntil/monthlySetAside | **yes** |
| `healthChecks(input)` | includes `today` | `HealthCheck[]` (fix/note/ok + link) | **yes** (in input) |
| `setupChecklist(counts)` | | 7 `SetupStep`s | no |
| `LIMITS` | constant | row caps | — |

## Core rules (`computePlan`)

For category c and month k (0 = first month):

- **Target(c)** (`targetOf`):
  - Drop it → none.
  - Same category, or a destination that no longer exists → c itself.
  - Move → the destination category.
- **ActualBase(c,k):**
  - Savings categories: the sum of positive amounts only. Withdrawals are ignored here.
  - All other types: the sum of all amounts, so refunds reduce it.
  - Transactions outside the 24-month window, or with an unknown category, are skipped.
- **CarryIn(c,0)** = 0.
- **CarryIn(c,k≥1)** = (Target exists ? min(Left(c,k−1), 0) : 0) + the sum of OutPos(s,k−1) over every s whose Target is c.
- **Auto(c,k)** = max(planned + CarryIn − ActualBase, 0) when the linked goal has `auto_count` and monthEnd(k) ≤ today; otherwise 0.
- **Left** = planned + CarryIn − ActualBase − Auto.
- **OutPos** = Target exists ? max(Left, 0) : 0.

So surpluses move only after the month, one hop per month. Shortfalls stay in their own category unless the category is Drop it. Backdated entries change that month and every later one.

## Tracker rows (`trackerRows`, `statusOf`)

- **Available** = planned + carry-in.
- **Actual** = ActualBase + Auto.
- **Remaining** = Available − Actual.
- **% used** = actual / available. If available is 0 or less, it is 100% when there is spending and 0% otherwise.
- **Status:**
  - Ahead of plan if remaining < 0 and the category type is Savings; Over budget if remaining < 0 for every other type (BRL-10).
  - Not started if actual = 0.
  - Done if remaining = 0.
  - Near limit if 90% or more is used.
  - Otherwise On track.
- **Carry-out** = 0 for Drop it; otherwise remaining.

## Month summary (`monthSummary`)

- **received** = income entries dated in month k.
- **plannedOut** and **actualOut** are summed over the tracker rows.
- **saved** = Savings-type actual.
- **spentExSavings** = actualOut − saved.
- **left** = received − actualOut.
- **savingsRate** = saved / (received if > 0, else planned income).
- **byType** gives planned and actual for each of the four types.

## Goals (`goalTotals`)

- **saved** = opening + all transaction amounts in linked categories (negatives reduce it, any month) + the sum of Auto over all months.
- **remaining** = max(target − saved, 0).
- **progress** is clamped to 0–100%.
- **monthlyPlan** = the sum of planned amounts of linked categories.
- **monthsToGo** = ceil(remaining / monthlyPlan).
- **estimatedCompletion** = the month of `today` + monthsToGo.

## Accounts (`accountTotals`)

- **calculated** = opening + income to the account − transactions on it + transfers in − transfers out.
- **balance** = actual if entered, otherwise calculated.
- **difference** = actual − calculated.
- **usable** = max(balance − minimum, 0).

## Recurring (`nextRecurringDue`, `recurringTotals`)

- **Step:** Monthly 1, Quarterly 3, Half-yearly 6, Yearly 12, One-time 0.
- **Next due:** the first due date advanced by whole steps to the first date on or after today. The day is clamped to the month's length.
  - One-time: the first due date if it is today or later, otherwise null ("Completed").
- **Status:** Due today, Due soon (7 days or fewer), Upcoming, Completed or Inactive.
- **Monthly set-aside** = amount / step. One-time items count as 0.
- **Due in month:** the month offset from the first due month is 0 or more and divisible by the step. One-time items are due only in their own month.

## Zakat (`zakatCalc`)

- **nisab** = grams × price for the chosen basis. It is 0 when the price is missing or 0.
- **assets** = account balances (passed in as `bankBalances` by `zakat.tsx`) + asset lines.
- **net** = max(assets − liabilities, 0).
- **due** = rate × net, if net ≥ nisab and nisab > 0.
- **already set aside** = transactions in the Zakat category dated within (anniversary − 12 months, anniversary].
- **still to set aside** = max(due − set aside, 0).
- **monthly suggestion** = ceil(still / months to anniversary), with months to anniversary at least 1.

## Interest (`interestTotals`)

- **waiting** = max(received − given, 0).

## Worked examples (from `docs/test-scenario.md`, today = 3 Oct 2026)

These are asserted in `src/lib/engine/scenario.test.ts`.

1. **Carry to another category.**
   - In August, Personal spending (plan 3,000, leftover goes to Emergency fund) spends 2,400. Left is 600, so OutPos is 600.
   - In September, Emergency fund's carry-in is 600.
   - In September, Personal spending overspends by 600. Its own carry-in in October is −600, because shortfalls stay.
2. **Drop it.** Groceries spends 6,400 of 6,000 in September. It is Over budget at −400, and its October carry-in is 0.
3. **Auto-count.**
   - Umrah has auto-count on and no September entry. When September ends, Auto = 6,000, so September's actual is 6,000.
   - October hasn't ended yet, so November's Umrah carry-in is 6,000 for now. After 31 Oct it becomes 0 (variant E6: total saved 18,000 with today = 2 Nov).
4. **Withdrawal.** Emergency fund −3,000 on 12 Oct. The October tracker actual stays 0, but the goal's total falls to 18,600 (5,000 opening + 13,600 logged).
5. **Accounts.**
   - Main bank: 20,000 opening + 152,000 income − 120,400 spending − 17,500 transfer = 34,100, so usable = 29,100.
   - Entering an actual balance of 33,000 shows a difference of −1,100.
6. **Zakat.**
   - Nisab is 612.36 × 100 = 61,236.
   - Assets are 61,600 (accounts) + 60,000 = 121,600, so due = 3,040.
   - 1,000 is already set aside, so 2,040 is left over 4 months: 510 a month.
7. **Recurring.**
   - Total monthly equivalent: 15,000 + 800 + 1,000 + 1,000 = 17,800. The one-time school fee adds 0.
   - Due in October: 15,800 (Rent + Internet).

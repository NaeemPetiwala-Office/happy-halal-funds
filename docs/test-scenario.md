# Test scenario (currency ₹, plan start 1 Aug 2026, 24-month window)
Dates: expected values assume today is between 1 and 31 Oct 2026. If testing later, shift the plan start and all dates forward by the same number of months so that the third month is the current month.

## Setup data
Income sources: Salary 50,000 (planned), Freelance 0.
Categories (name | type | planned | leftover goes to | goal). Total planned 50,000, unallocated 0.
Rent | Fixed | 15,000 | Drop it | none
Groceries | Fixed | 6,000 | Drop it | none
Transport | Fixed | 1,500 | Drop it | none
Personal spending | Variable | 3,000 | Emergency fund | none
Medical buffer | Variable | 2,000 | Same category | none
Sadaqah | Giving | 1,000 | Same category | none
Zakat set-aside | Giving | 500 | Same category | none
Miscellaneous | Variable | 3,500 | Drop it | none
Emergency fund | Savings | 8,000 | Same category | Emergency Fund
Umrah fund | Savings | 6,000 | Same category | Umrah
Laptop fund | Savings | 3,500 | Same category | Laptop
Goals: Emergency Fund (target 60,000, opening 5,000, Auto-count No); Umrah (target 120,000, opening 0, Auto-count Yes); Laptop (target 40,000, opening 0, Auto-count No).
Accounts: Main bank (opening 20,000, minimum 5,000); Savings bank (opening 10,000, minimum 0). Transfer 21 Aug 2026 Main bank to Savings bank 17,500.
Income entries (into Main bank): 1 Aug Salary 50,000; 1 Sep Salary 50,000; 28 Sep Freelance 2,000; 1 Oct Salary 50,000.
Transactions (all from Main bank, 2026), date | category | amount:
1 Aug Rent 15,000; 3 Aug Groceries 5,200; 5 Aug Transport 1,200; 9 Aug Personal spending 2,400; 12 Aug Medical buffer 500; 15 Aug Sadaqah 1,000; 18 Aug Zakat set-aside 500; 20 Aug Emergency fund 8,000; 20 Aug Umrah fund 6,000; 20 Aug Laptop fund 3,500; 25 Aug Miscellaneous 3,800;
1 Sep Rent 15,000; 4 Sep Groceries 6,400; 6 Sep Transport 1,000; 10 Sep Personal spending 3,600; 14 Sep Medical buffer 3,000; 18 Sep Zakat set-aside 500; 22 Sep Emergency fund 8,600; 22 Sep Laptop fund 2,000; 25 Sep Miscellaneous 3,000;
1 Oct Rent 15,000; 2 Oct Groceries 2,000; 3 Oct Transport 500; 4 Oct Personal spending 1,000; 12 Oct Emergency fund -3,000 (withdrawal); 14 Oct Groceries -300 (refund);
2 Nov Rent 15,000.
No Umrah or Sadaqah entry in September.
Recurring: Rent (cat Rent) 15,000 Monthly first due 1 Aug 2026; Internet (Miscellaneous) 800 Monthly 5 Aug 2026; Maintenance (Miscellaneous) 3,000 Quarterly 10 Aug 2026; Takaful car insurance (Miscellaneous) 12,000 Yearly 20 Dec 2026; School fee (Miscellaneous) 5,000 One-time 15 Nov 2026.
Zakat: basis Silver, silver price 100 per gram (default 612.36 g), cash 10,000, gold 50,000, no liabilities, anniversary 20 Feb 2027, category "Zakat set-aside". Interest: received 30 Sep 2026 (Savings bank) 120; given 5 Oct 2026 (Local charity) 100.

## Expected results (carry-in | actual | remaining | status | carry-out)
AUGUST: income received 50,000; actual out 47,100; left 2,900; savings rate 35%; spent excl. savings 29,600; saved 17,500.
Rent 0|15,000|0|Done|0
Groceries 0|5,200|800|On track|0
Transport 0|1,200|300|On track|0
Personal spending 0|2,400|600|On track|600
Medical buffer 0|500|1,500|On track|1,500
Sadaqah 0|1,000|0|Done|0
Zakat set-aside 0|500|0|Done|0
Miscellaneous 0|3,800|-300|Over budget|0
Emergency fund 0|8,000|0|Done|0
Umrah fund 0|6,000|0|Done|0
Laptop fund 0|3,500|0|Done|0
SEPTEMBER: income received 52,000; actual out 49,100; left 2,900; savings rate 31.9%; spent excl. savings 32,500; saved 16,600 (includes 6,000 auto-counted for Umrah).
Rent 0|15,000|0|Done|0
Groceries 0|6,400|-400|Over budget|0 (Drop it: no carry)
Transport 0|1,000|500|On track|0
Personal spending 0|3,600|-600|Over budget|-600 (shortfall stays)
Medical buffer 1,500|3,000|500|On track|500
Sadaqah 0|0|1,000|Not started|1,000
Zakat set-aside 0|500|0|Done|0
Miscellaneous 0|3,000|500|On track|0
Emergency fund 600 (moved from Personal spending)|8,600|0|Done|0
Umrah fund 0|6,000 (auto-counted)|0|Done|0
Laptop fund 0|2,000|1,500|On track|1,500
OCTOBER (in progress): income received 50,000; actual out 18,200; left 31,800; savings rate 0%; spent excl. savings 18,200; saved 0.
Rent 0|15,000|0|Done|0
Groceries 0|1,700|4,300|On track|0
Transport 0|500|1,000|On track|0
Personal spending -600|1,000|1,400|On track|1,400
Medical buffer 500|0|2,500|Not started|2,500
Sadaqah 1,000|0|2,000|Not started|2,000
Zakat set-aside 0|0|500|Not started|500
Miscellaneous 0|0|3,500|Not started|0
Emergency fund 0|0 (the -3,000 withdrawal is NOT budget activity)|8,000|Not started|8,000
Umrah fund 0|0|6,000|Not started|6,000
Laptop fund 1,500|0|5,000|Not started|5,000
October by type (planned|actual|% of income): Fixed 22,500|17,200|45%; Variable 8,500|1,000|17%; Giving 1,500|0|3%; Savings 17,500|0|35%.
NOVEMBER: income received 0; actual out 15,000; left -15,000. Carry-in | actual | remaining:
Rent 0|15,000|0; Groceries 0|0|6,000; Transport 0|0|1,500; Personal spending 0|0|3,000; Medical buffer 2,500|0|4,500; Sadaqah 2,000|0|3,000; Zakat set-aside 500|0|1,000; Miscellaneous 0|0|3,500; Emergency fund 9,400|0|17,400; Umrah fund 6,000 (projection: October not finished)|0|12,000; Laptop fund 5,000|0|8,500.
After 31 Oct, October's Umrah 6,000 is auto-counted and the November Umrah carry-in becomes 0.

## Goals (as of October): logged | auto | total saved | remaining | progress | monthly plan | months to go
Emergency Fund 13,600 | 0 | 18,600 (incl. 5,000 opening) | 41,400 | 31% | 8,000 | 6
Umrah 6,000 | 6,000 | 12,000 | 108,000 | 10% | 6,000 | 18
Laptop 5,500 | 0 | 5,500 | 34,500 | 13.75% | 3,500 | 10
Total saved across goals 36,100.

## Accounts: opening | in | out | transfers | calculated | usable
Main bank 20,000 | 152,000 | 120,400 | -17,500 | 34,100 | 29,100
Savings bank 10,000 | 0 | 0 | +17,500 | 27,500 | 27,500
Total 61,600; usable 56,600. Entering Actual 33,000 for Main bank must show Difference -1,100 and use 33,000 in totals.

## Recurring (run on 3 Oct 2026; days depend on the day)
Rent next due 1 Nov, Upcoming, set-aside 15,000. Internet 5 Oct, Due soon, 800. Maintenance 10 Nov, Upcoming, 1,000. Takaful 20 Dec, Upcoming, 1,000. School fee 15 Nov, Upcoming.
Total monthly equivalent 17,800. Due in selected month: Oct 15,800 (Rent, Internet); Nov 23,800 (Rent, Internet, Maintenance, School fee); Dec 27,800 (Rent, Internet, Takaful).

## Zakat, interest, health
Zakat: nisab 61,236; bank balances 61,600 (linked); total assets 121,600; net 121,600; above nisab Yes; due 3,040; already set aside 1,000; still to set aside 2,040; months to anniversary 4; suggested monthly 510; 140 days to 20 Feb 2027 on 3 Oct 2026.
Interest: received 120, given 100, waiting 20.
Health Check (October): All good, with one Note (interest waiting 20).
Dashboard alerts (October): health OK; over-budget 0; near limit 0; recurring due within 7 days 1; interest waiting 20; unallocated 0.

## Variants (apply on top of the base scenario)
E1: log 15 Oct Umrah fund 9,000. October Umrah actual 9,000, remaining -3,000, Over budget, carry-out -3,000. November carry-in -3,000, available 3,000. Umrah goal total 21,000. Over-budget alert 1.
E2: log 20 Oct Transport 3,000 (total 3,500 vs plan 1,500). October remaining -2,000, Over budget. November Transport carry-in 0.
E3: log 16 Oct Laptop fund -10,000. Laptop goal total -4,500, progress 0%, remaining 44,500. Tracker Laptop row unchanged (carry-in 1,500, remaining 5,000). The app must not crash and should warn that withdrawals exceed deposits.
E4: set Umrah Auto-count to No. Umrah total 6,000, remaining 114,000, 5%, months 19; October Umrah carry-in 6,000. Switching back to Yes restores 12,000.
E5: backdate 30 Aug Medical buffer 400. August remaining 1,100; September carry-in 1,100; October carry-in 100, available 2,100; November carry-in 2,100 (was 2,500).
E6 (derived from the rules, not run in the reference): with today = 2 Nov 2026, Umrah total saved 18,000; November Umrah carry-in 0, available 6,000.
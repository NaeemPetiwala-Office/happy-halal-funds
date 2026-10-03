# Build goals, accounts, transfers, and recurring payments

## Calculation foundation
- Extend the pure budgeting engine with account balance summaries and recurring-payment schedules.
- Keep all balances, differences, usable funds, next due dates, status, selected-month due state, and monthly equivalents derived from raw entries.
- Add focused tests for account inflows/outflows/transfers and monthly, quarterly, yearly, one-time, and future recurring dates.

## Goals
- Replace the placeholder with editable goal cards and a compact comparison table.
- Show target, opening saved, logged savings, auto-counted savings, total, remaining, progress, monthly plan, months to go, estimated completion, priority, status, and an Auto-count switch.
- Support adding, editing, and deleting goals while respecting the existing ten-goal limit.

## Accounts and transfers
- Replace the placeholder with account cards showing calculated balance, optional actual balance, difference, minimum balance, and usable funds.
- Add account creation/editing/deletion and a transfer history with add/edit/delete controls.

## Recurring payments
- Replace the placeholder with recurring-payment management for category, amount, frequency, first due date, and active state.
- Show next due, days until, status, monthly set-aside, whether it is due in the globally selected month, and the total monthly equivalent.

## Verification
- Run the engine tests.
- Exercise adding/editing the new records and inspect all three screens in the running preview at desktop and mobile sizes.
- Confirm the latest preview build is healthy.

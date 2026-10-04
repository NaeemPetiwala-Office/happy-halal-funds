/** Fixture of docs/test-scenario.md (base data only; variants are applied in the tests). */
import type { EAccount, ECategory, EGoal, ERecurringItem } from "./index";

export const PLAN_START = "2026-08-01";
export const TODAY = "2026-10-03";

const c = (id: string, type: ECategory["type"], planned: number, mode: ECategory["leftover_mode"], dest: string | null = null, goal: string | null = null): ECategory => ({
  id, name: id, type, planned, leftover_mode: mode, leftover_category_id: dest, goal_id: goal,
});

export const categories: ECategory[] = [
  c("Rent", "Fixed", 15000, "drop"),
  c("Groceries", "Fixed", 6000, "drop"),
  c("Transport", "Fixed", 1500, "drop"),
  c("Personal spending", "Variable", 3000, "move", "Emergency fund"),
  c("Medical buffer", "Variable", 2000, "same"),
  c("Sadaqah", "Giving", 1000, "same"),
  c("Zakat set-aside", "Giving", 500, "same"),
  c("Miscellaneous", "Variable", 3500, "drop"),
  c("Emergency fund", "Savings", 8000, "same", null, "Emergency Fund"),
  c("Umrah fund", "Savings", 6000, "same", null, "Umrah"),
  c("Laptop fund", "Savings", 3500, "same", null, "Laptop"),
];

export const goals: EGoal[] = [
  { id: "Emergency Fund", name: "Emergency Fund", target: 60000, opening_saved: 5000, auto_count: false },
  { id: "Umrah", name: "Umrah", target: 120000, opening_saved: 0, auto_count: true },
  { id: "Laptop", name: "Laptop", target: 40000, opening_saved: 0, auto_count: false },
];

export const PLANNED_INCOME = 50000;
export const incomeSources = [{ name: "Salary", monthly_amount: 50000 }, { name: "Freelance", monthly_amount: 0 }];

export const accounts: EAccount[] = [
  { id: "Main bank", name: "Main bank", opening_balance: 20000, minimum_balance: 5000, actual_balance: null },
  { id: "Savings bank", name: "Savings bank", opening_balance: 10000, minimum_balance: 0, actual_balance: null },
];
export const transfers = [{ date: "2026-08-21", from_account_id: "Main bank", to_account_id: "Savings bank", amount: 17500 }];

export const incomeEntries = [
  { date: "2026-08-01", source: "Salary", amount: 50000, account_id: "Main bank" },
  { date: "2026-09-01", source: "Salary", amount: 50000, account_id: "Main bank" },
  { date: "2026-09-28", source: "Freelance", amount: 2000, account_id: "Main bank" },
  { date: "2026-10-01", source: "Salary", amount: 50000, account_id: "Main bank" },
];

const raw: [string, string, number][] = [
  ["2026-08-01", "Rent", 15000], ["2026-08-03", "Groceries", 5200], ["2026-08-05", "Transport", 1200],
  ["2026-08-09", "Personal spending", 2400], ["2026-08-12", "Medical buffer", 500], ["2026-08-15", "Sadaqah", 1000],
  ["2026-08-18", "Zakat set-aside", 500], ["2026-08-20", "Emergency fund", 8000], ["2026-08-20", "Umrah fund", 6000],
  ["2026-08-20", "Laptop fund", 3500], ["2026-08-25", "Miscellaneous", 3800],
  ["2026-09-01", "Rent", 15000], ["2026-09-04", "Groceries", 6400], ["2026-09-06", "Transport", 1000],
  ["2026-09-10", "Personal spending", 3600], ["2026-09-14", "Medical buffer", 3000], ["2026-09-18", "Zakat set-aside", 500],
  ["2026-09-22", "Emergency fund", 8600], ["2026-09-22", "Laptop fund", 2000], ["2026-09-25", "Miscellaneous", 3000],
  ["2026-10-01", "Rent", 15000], ["2026-10-02", "Groceries", 2000], ["2026-10-03", "Transport", 500],
  ["2026-10-04", "Personal spending", 1000], ["2026-10-12", "Emergency fund", -3000], ["2026-10-14", "Groceries", -300],
  ["2026-11-02", "Rent", 15000],
];
export const transactions = raw.map(([date, category_id, amount]) => ({ date, category_id, amount, account_id: "Main bank" }));

const r = (name: string, category_id: string, amount: number, frequency: ERecurringItem["frequency"], first_due_date: string): ERecurringItem => ({
  id: name, name, category_id, amount, frequency, first_due_date, active: true,
});
export const recurring: ERecurringItem[] = [
  r("Rent", "Rent", 15000, "Monthly", "2026-08-01"),
  r("Internet", "Miscellaneous", 800, "Monthly", "2026-08-05"),
  r("Maintenance", "Miscellaneous", 3000, "Quarterly", "2026-08-10"),
  r("Takaful car insurance", "Miscellaneous", 12000, "Yearly", "2026-12-20"),
  r("School fee", "Miscellaneous", 5000, "One-time", "2026-11-15"),
];

export const zakat = {
  basis: "Silver" as const, gold_grams: 87.48, silver_grams: 612.36, gold_price: null, silver_price: 100, rate: 0.025,
  anniversary_date: "2027-02-20", zakat_category_id: "Zakat set-aside",
  lines: [{ kind: "asset" as const, amount: 10000 }, { kind: "asset" as const, amount: 50000 }],
};
export const interestReceived = [{ date: "2026-09-30", account_id: "Savings bank", amount: 120 }];
export const interestGiven = [{ date: "2026-10-05", recipient: "Local charity", amount: 100 }];

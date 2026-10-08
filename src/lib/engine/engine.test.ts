import { describe, it, expect } from "vitest";
import {
  statusOf,
  computePlan,
  accountTotals,
  findCategoryByName,
  goalTotals,
  monthSummary,
  trackerRows,
  nextRecurringDue,
  recurringDueInMonth,
  recurringTotals,
  type ECategory,
  type EGoal,
  type ETransaction,
} from "./index";

const START = "2025-01-01";
const AFTER_ALL = "2027-02-15"; // all 24 months completed
const cat = (p: Partial<ECategory> & { id: string }): ECategory => ({
  name: p.id,
  type: "Variable",
  planned: 0,
  leftover_mode: "same",
  leftover_category_id: null,
  goal_id: null,
  ...p,
});
const goal = (p: Partial<EGoal> & { id: string }): EGoal => ({
  name: p.id,
  target: null,
  opening_saved: 0,
  auto_count: true,
  ...p,
});
const cell = (plan: ReturnType<typeof computePlan>, id: string, k: number) => plan.cells[id]![k]!;

describe("engine", () => {
  it("(a) leftover moves to destination; backdated entry updates it", () => {
    const cats = [
      cat({ id: "ps", name: "Personal spending", planned: 2000, leftover_mode: "move", leftover_category_id: "ef" }),
      cat({ id: "ef", name: "Emergency fund", type: "Savings" }),
    ];
    const txs: ETransaction[] = [{ date: "2025-01-10", category_id: "ps", amount: 700 }];
    let plan = computePlan({ planStart: START, today: "2025-02-10", categories: cats, transactions: txs, goals: [] });
    expect(cell(plan, "ef", 1).carryIn).toBe(1300);
    txs.push({ date: "2025-01-28", category_id: "ps", amount: 300 });
    plan = computePlan({ planStart: START, today: "2025-02-10", categories: cats, transactions: txs, goals: [] });
    expect(cell(plan, "ef", 1).carryIn).toBe(1000);
  });

  it("(b) overspent category keeps its own negative carry-in", () => {
    const cats = [
      cat({ id: "a", planned: 100, leftover_mode: "move", leftover_category_id: "b" }),
      cat({ id: "b" }),
    ];
    const plan = computePlan({
      planStart: START,
      today: "2025-03-01",
      categories: cats,
      transactions: [{ date: "2025-01-05", category_id: "a", amount: 150 }],
      goals: [],
    });
    expect(cell(plan, "a", 1).carryIn).toBe(-50);
    expect(cell(plan, "b", 1).carryIn).toBe(0);
  });

  it("(c) chain A -> B -> C moves one hop per month", () => {
    const cats = [
      cat({ id: "A", planned: 100, leftover_mode: "move", leftover_category_id: "B" }),
      cat({ id: "B", leftover_mode: "move", leftover_category_id: "C" }),
      cat({ id: "C" }),
    ];
    const plan = computePlan({ planStart: START, today: AFTER_ALL, categories: cats, transactions: [], goals: [] });
    expect(cell(plan, "B", 1).carryIn).toBe(100);
    expect(cell(plan, "C", 1).carryIn).toBe(0);
    expect(cell(plan, "C", 2).carryIn).toBe(100);
  });

  it("(d) 24 completed months, plan 3000, one 3000 deposit -> auto 69000, total 72000", () => {
    const cats = [cat({ id: "s", type: "Savings", planned: 3000, goal_id: "g" })];
    const txs = [{ date: "2025-01-03", category_id: "s", amount: 3000 }];
    const plan = computePlan({ planStart: START, today: AFTER_ALL, categories: cats, transactions: txs, goals: [goal({ id: "g" })] });
    const auto = plan.cells["s"]!.reduce((a, c) => a + c.auto, 0);
    expect(auto).toBe(69000);
    expect(goalTotals(plan, [goal({ id: "g" })], txs)[0]!.saved).toBe(72000);
  });

  it("(e) plan 2300 with extra 5000 deposit in month 1 -> total 55200", () => {
    const cats = [cat({ id: "s", type: "Savings", planned: 2300, goal_id: "g" })];
    const txs = [{ date: "2025-02-14", category_id: "s", amount: 5000 }];
    const plan = computePlan({ planStart: START, today: AFTER_ALL, categories: cats, transactions: txs, goals: [goal({ id: "g" })] });
    expect(goalTotals(plan, [goal({ id: "g" })], txs)[0]!.saved).toBe(55200);
  });

  it("(f) negative savings amount lowers the goal but not next month's carry-in", () => {
    const cats = [cat({ id: "s", type: "Savings", planned: 500, goal_id: "g" })];
    const g = goal({ id: "g", auto_count: false });
    const base = [{ date: "2025-01-02", category_id: "s", amount: 500 }];
    const withdraw = [...base, { date: "2025-01-20", category_id: "s", amount: -200 }];
    const p1 = computePlan({ planStart: START, today: "2025-03-01", categories: cats, transactions: base, goals: [g] });
    const p2 = computePlan({ planStart: START, today: "2025-03-01", categories: cats, transactions: withdraw, goals: [g] });
    expect(cell(p2, "s", 1).carryIn).toBe(cell(p1, "s", 1).carryIn);
    expect(cell(p2, "s", 1).carryIn).toBe(0);
    expect(goalTotals(p2, [g], withdraw)[0]!.saved).toBe(300);
  });

  it("(g) names with special characters match exactly", () => {
    const cats = [
      cat({ id: "1", name: "Eid *gifts?" }),
      cat({ id: "2", name: "Eid gifts" }),
      cat({ id: "3", name: "=Weird name" }),
    ];
    expect(findCategoryByName(cats, "Eid *gifts?")?.id).toBe("1");
    expect(findCategoryByName(cats, "Eid gifts")?.id).toBe("2");
    expect(findCategoryByName(cats, "=Weird name")?.id).toBe("3");
    expect(findCategoryByName(cats, "Eid *")).toBeUndefined();
    expect(findCategoryByName(cats, "eid *gifts?")).toBeUndefined();
    expect(findCategoryByName(cats, "Weird name")).toBeUndefined();
  });

  it("tracker statuses and month summary", () => {
    const cats = [
      cat({ id: "rent", type: "Fixed", planned: 1000 }),
      cat({ id: "food", planned: 100 }),
      cat({ id: "save", type: "Savings", planned: 200, leftover_mode: "drop" }),
    ];
    const txs = [
      { date: "2025-01-01", category_id: "rent", amount: 1000 },
      { date: "2025-01-05", category_id: "food", amount: 120 },
    ];
    const plan = computePlan({ planStart: START, today: "2025-01-20", categories: cats, transactions: txs, goals: [] });
    const rows = trackerRows(plan, 0);
    expect(rows.map((r) => r.status)).toEqual(["Done", "Over budget", "Not started"]);
    expect(rows[2]!.carryOut).toBe(0);
    const s = monthSummary(plan, 0, [{ date: "2025-01-01", amount: 2000 }], 2000);
    expect(s.left).toBe(880);
    expect(s.savingsRate).toBe(0);
  });

  it("calculates account balances from income, spending and transfers, then uses actual balance", () => {
    const accounts = [
      { id: "cash", name: "Cash", opening_balance: 1000, minimum_balance: 200, actual_balance: null },
      { id: "bank", name: "Bank", opening_balance: 500, minimum_balance: 100, actual_balance: 900 },
    ];
    const totals = accountTotals(
      accounts,
      [{ account_id: "cash", amount: 600 }],
      [{ account_id: "cash", amount: 250 }],
      [{ from_account_id: "cash", to_account_id: "bank", amount: 150 }],
    );
    expect(totals[0]).toMatchObject({ calculated: 1200, balance: 1200, difference: null, usable: 1000 });
    expect(totals[1]).toMatchObject({ calculated: 650, balance: 900, difference: 250, usable: 800 });
  });

  it("calculates monthly, quarterly, yearly and one-time recurring dates", () => {
    const base = { id: "r", name: "Payment", amount: 1200, category_id: null, active: true };
    expect(nextRecurringDue({ ...base, frequency: "Monthly", first_due_date: "2026-01-31" }, "2026-02-01")).toBe("2026-02-28");
    expect(nextRecurringDue({ ...base, frequency: "Quarterly", first_due_date: "2026-01-15" }, "2026-04-15")).toBe("2026-04-15");
    expect(nextRecurringDue({ ...base, frequency: "Yearly", first_due_date: "2024-02-29" }, "2025-01-01")).toBe("2025-02-28");
    expect(nextRecurringDue({ ...base, frequency: "One-time", first_due_date: "2026-11-20" }, "2026-10-03")).toBe("2026-11-20");
    expect(nextRecurringDue({ ...base, frequency: "One-time", first_due_date: "2026-01-20" }, "2026-10-03")).toBeNull();
    expect(recurringDueInMonth({ ...base, frequency: "Quarterly", first_due_date: "2026-01-15" }, "2026-07")).toBe(true);
    expect(recurringDueInMonth({ ...base, frequency: "Quarterly", first_due_date: "2026-01-15" }, "2026-08")).toBe(false);
  });

  it("keeps a future recurring date and derives status and monthly set-aside", () => {
    const item = { id: "future", name: "Qurbani", amount: 1200, category_id: null, active: true, frequency: "Yearly" as const, first_due_date: "2027-06-01" };
    const total = recurringTotals([item], "2026-10-03", "2027-06")[0]!;
    expect(total.nextDue).toBe("2027-06-01");
    expect(total.status).toBe("Upcoming");
    expect(total.monthlySetAside).toBe(100);
    expect(total.dueInSelectedMonth).toBe(true);
  });
});

describe("statusOf (BRL-10)", () => {
  it("Savings overspend is Ahead of plan, any other overspend is Over budget", () => {
    expect(statusOf(6000, 9000, -3000, 150, "Savings")).toBe("Ahead of plan");
    expect(statusOf(6000, 9000, -3000, 150, "Variable")).toBe("Over budget");
    expect(statusOf(6000, 9000, -3000, 150, "Fixed")).toBe("Over budget");
    expect(statusOf(6000, 9000, -3000, 150, "Giving")).toBe("Over budget");
  });
  it("applies the remaining BRL-10 rules in order", () => {
    expect(statusOf(1000, 0, 1000, 0, "Savings")).toBe("Not started");
    expect(statusOf(1000, 1000, 0, 100, "Variable")).toBe("Done");
    expect(statusOf(1000, 900, 100, 90, "Variable")).toBe("Near limit");
    expect(statusOf(1000, 500, 500, 50, "Variable")).toBe("On track");
  });
});

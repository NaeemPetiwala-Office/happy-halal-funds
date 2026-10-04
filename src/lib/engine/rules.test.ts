/** Focused rule tests: refunds/withdrawals, chains, missing destinations, Drop it, names, plan start, recurring, Zakat. */
import { describe, expect, it } from "vitest";
import {
  computePlan, findCategoryByName, goalTotals, nextRecurringDue, normalizePlanStart, recurringDueInMonth,
  recurringTotals, trackerRows, zakatCalc, type ECategory, type ERecurringItem,
} from "./index";
import { validateCategoryName } from "../budget-rules";

const START = "2026-01-01";
const cat = (p: Partial<ECategory> & { id: string }): ECategory => ({
  name: p.id, type: "Variable", planned: 0, leftover_mode: "same", leftover_category_id: null, goal_id: null, ...p,
});
const plan = (cats: ECategory[], txs: { date: string; category_id: string; amount: number }[] = [], today = "2027-12-31", planStart = START) =>
  computePlan({ planStart, today, categories: cats, transactions: txs, goals: [{ id: "g", name: "g", target: 1000, opening_saved: 0, auto_count: false }] });
const r = (p: ReturnType<typeof plan>, k: number, id: string) => trackerRows(p, k).find((x) => x.category.id === id)!;

describe("refunds and withdrawals", () => {
  it("refund in a non-savings category lowers actual and raises carry-out", () => {
    const p = plan([cat({ id: "food", planned: 500 })], [
      { date: "2026-01-05", category_id: "food", amount: 300 },
      { date: "2026-01-09", category_id: "food", amount: -50 },
    ]);
    expect([r(p, 0, "food").actual, r(p, 0, "food").remaining, r(p, 1, "food").carryIn]).toEqual([250, 250, 250]);
  });
  it("refund larger than spending gives negative actual (no crash)", () => {
    const p = plan([cat({ id: "food", planned: 100 })], [{ date: "2026-01-05", category_id: "food", amount: -40 }]);
    expect([r(p, 0, "food").actual, r(p, 0, "food").remaining]).toEqual([-40, 140]);
  });
  it("withdrawal in a savings category is ignored by the tracker but lowers the goal", () => {
    const cats = [cat({ id: "s", type: "Savings", planned: 400, goal_id: "g" })];
    const txs = [{ date: "2026-01-03", category_id: "s", amount: 400 }, { date: "2026-01-20", category_id: "s", amount: -150 }];
    const p = plan(cats, txs);
    expect([r(p, 0, "s").actual, r(p, 0, "s").remaining, r(p, 1, "s").carryIn]).toEqual([400, 0, 0]);
    expect(goalTotals(p, [{ id: "g", name: "g", target: 1000, opening_saved: 0, auto_count: false }], txs)[0]!.saved).toBe(250);
  });
});

describe("leftover routing", () => {
  it("chain A -> B -> C moves one hop per month", () => {
    const p = plan([
      cat({ id: "A", planned: 100, leftover_mode: "move", leftover_category_id: "B" }),
      cat({ id: "B", leftover_mode: "move", leftover_category_id: "C" }),
      cat({ id: "C" }),
    ]);
    expect([r(p, 1, "B").carryIn, r(p, 1, "C").carryIn]).toEqual([100, 0]);
    expect([r(p, 2, "B").carryIn, r(p, 2, "C").carryIn]).toEqual([100, 100]); // A sends 100 again in month 1
    expect(r(p, 2, "C").carryIn).toBe(100);
  });
  it("destination that no longer exists falls back to the category itself", () => {
    const p = plan([cat({ id: "A", planned: 100, leftover_mode: "move", leftover_category_id: "deleted" })], [
      { date: "2026-01-02", category_id: "A", amount: 30 },
    ]);
    expect(r(p, 1, "A").carryIn).toBe(70);
  });
  it("Drop it: no leftover and no shortfall carried; carry-out 0", () => {
    const p = plan([cat({ id: "D", planned: 100, leftover_mode: "drop" })], [
      { date: "2026-01-02", category_id: "D", amount: 30 },
      { date: "2026-02-02", category_id: "D", amount: 180 },
    ]);
    expect([r(p, 0, "D").carryOut, r(p, 1, "D").carryIn, r(p, 1, "D").remaining, r(p, 1, "D").carryOut, r(p, 2, "D").carryIn]).toEqual([0, 0, -80, 0, 0]);
  });
});

describe("names", () => {
  const names = ['Eid *gifts?', "a~b", 'say "hi"', "Mum's", "R&D", "<tag>", "=SUM(1)", "Eid 🎉", "صدقة", "a > b"];
  const cats = names.map((n, i) => ({ id: String(i), name: n }));
  it("special characters, emoji and Arabic match exactly", () => {
    names.forEach((n, i) => expect(findCategoryByName(cats, n)?.id).toBe(String(i)));
    expect(findCategoryByName(cats, "Eid *")).toBeUndefined();
    expect(findCategoryByName(cats, "Eid ?gifts?")).toBeUndefined();
    expect(findCategoryByName(cats, "صدقه")).toBeUndefined();
    names.forEach((n) => expect(validateCategoryName(n, [])).toBeNull());
  });
  it("duplicate names rejected, reserved names rejected", () => {
    expect(validateCategoryName("صدقة", cats)).toMatch(/already exists/);
    expect(validateCategoryName("Eid *gifts?", cats)).toMatch(/already exists/);
    expect(validateCategoryName("Eid gifts", cats)).toBeNull();
    expect(validateCategoryName("Same category", [])).toMatch(/reserved/);
    expect(validateCategoryName("Drop it", [])).toMatch(/reserved/);
  });
});

describe("plan start", () => {
  it("mid-month plan start is normalised to the 1st", () => {
    expect(normalizePlanStart("2026-08-17")).toBe("2026-08-01");
    const p = plan([cat({ id: "x", planned: 10 })], [{ date: "2026-08-03", category_id: "x", amount: 5 }], "2026-09-01", "2026-08-17");
    expect(p.planStart).toBe("2026-08-01");
    expect(p.months[0]).toBe("2026-08");
    expect(r(p, 0, "x").actual).toBe(5); // 3 Aug counts even though "start" was typed as 17 Aug
  });
});

describe("recurring due dates", () => {
  const base: Omit<ERecurringItem, "frequency" | "first_due_date"> = { id: "r", name: "r", amount: 1200, category_id: null, active: true };
  const T = "2026-10-03";
  it("monthly", () => expect(nextRecurringDue({ ...base, frequency: "Monthly", first_due_date: "2026-08-05" }, T)).toBe("2026-10-05"));
  it("quarterly", () => {
    const it = { ...base, frequency: "Quarterly" as const, first_due_date: "2026-08-10" };
    expect(nextRecurringDue(it, T)).toBe("2026-11-10");
    expect([recurringDueInMonth(it, "2026-10"), recurringDueInMonth(it, "2026-11")]).toEqual([false, true]);
  });
  it("yearly", () => expect(nextRecurringDue({ ...base, frequency: "Yearly", first_due_date: "2025-10-01" }, T)).toBe("2026-10-01".replace("2026-10-01", "2027-10-01")));
  it("one-time: upcoming then completed", () => {
    expect(nextRecurringDue({ ...base, frequency: "One-time", first_due_date: "2026-11-15" }, T)).toBe("2026-11-15");
    const done = recurringTotals([{ ...base, frequency: "One-time", first_due_date: "2026-09-15" }], T, "2026-10")[0]!;
    expect([done.nextDue, done.status, done.monthlySetAside]).toEqual([null, "Completed", 0]);
  });
  it("first due later than today", () => {
    const t = recurringTotals([{ ...base, frequency: "Monthly", first_due_date: "2027-01-20" }], T, "2026-10")[0]!;
    expect([t.nextDue, t.status, t.dueInSelectedMonth, t.monthlySetAside]).toEqual(["2027-01-20", "Upcoming", false, 1200]);
  });
});

describe("Zakat", () => {
  const z = { basis: "Silver" as const, gold_grams: 87.48, silver_grams: 612.36, gold_price: null, rate: 0.025, anniversary_date: "2027-02-20", zakat_category_id: null, transactions: [], today: "2026-10-03" };
  it("metal price missing: nisab 0, nothing due", () => {
    const r = zakatCalc({ ...z, silver_price: null, lines: [{ kind: "asset", amount: 100000 }] });
    expect([r.nisab, r.meetsNisab, r.due]).toEqual([0, false, 0]);
  });
  it("below nisab", () => {
    const r = zakatCalc({ ...z, silver_price: 100, lines: [{ kind: "asset", amount: 61235 }] });
    expect([r.meetsNisab, r.due]).toEqual([false, 0]);
  });
  it("above nisab (liabilities deducted)", () => {
    const r = zakatCalc({ ...z, silver_price: 100, lines: [{ kind: "asset", amount: 90000 }, { kind: "liability", amount: 10000 }] });
    expect(r.net).toBe(80000);
    expect(r.meetsNisab).toBe(true);
    expect(r.due).toBeCloseTo(2000, 6);
  });
});

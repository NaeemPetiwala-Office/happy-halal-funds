/** Every number from docs/test-scenario.md, today = 3 Oct 2026, plus variants E1–E6. */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  accountTotals, computePlan, goalTotals, healthChecks, interestTotals, monthSummary, recurringTotals,
  trackerRows, zakatCalc, type ETransaction, type EGoal,
} from "./index";
import * as F from "./scenario.fixture";

type Tx = ETransaction & { account_id?: string };
const run = (opts: { today?: string; extra?: Tx[]; goals?: EGoal[]; txs?: Tx[] } = {}) => {
  const today = opts.today ?? F.TODAY;
  const txs = [...(opts.txs ?? F.transactions), ...(opts.extra ?? [])];
  const goals = opts.goals ?? F.goals;
  const plan = computePlan({ planStart: F.PLAN_START, today, categories: F.categories, transactions: txs, goals });
  return { plan, txs, goals, today };
};
const row = (plan: ReturnType<typeof computePlan>, k: number, name: string) => trackerRows(plan, k).find((r) => r.category.name === name)!;
/** [carry-in, actual, remaining, status, carry-out] */
type Exp = [number, number, number, string, number];
const checkRows = (k: number, exp: Record<string, Exp>) => {
  const { plan } = run();
  for (const [name, [ci, act, rem, st, co]] of Object.entries(exp)) {
    const r = row(plan, k, name);
    expect({ name, ci: r.carryIn, act: r.actual, rem: r.remaining, st: r.status, co: r.carryOut }).toEqual({ name, ci, act, rem, st, co });
  }
};
const summary = (k: number, o = run()) => monthSummary(o.plan, k, F.incomeEntries, F.PLANNED_INCOME);

describe("determinism", () => {
  it("engine source never reads the clock", () => {
    const dir = path.resolve(__dirname);
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".ts") && !x.includes(".test.") && !x.includes(".fixture."))) {
      const src = readFileSync(path.join(dir, f), "utf8");
      expect(src, f).not.toMatch(/new Date\(\s*\)|Date\.now\(/);
    }
  });
  it("same inputs give the same output", () => {
    expect(JSON.stringify(run().plan)).toBe(JSON.stringify(run().plan));
  });
});

describe("August (month 0)", () => {
  it("summary", () => {
    const s = summary(0);
    expect([s.received, s.actualOut, s.left, s.spentExSavings, s.saved]).toEqual([50000, 47100, 2900, 29600, 17500]);
    expect(s.savingsRate).toBeCloseTo(0.35, 6);
  });
  it("tracker rows", () => checkRows(0, {
    Rent: [0, 15000, 0, "Done", 0], Groceries: [0, 5200, 800, "On track", 0], Transport: [0, 1200, 300, "On track", 0],
    "Personal spending": [0, 2400, 600, "On track", 600], "Medical buffer": [0, 500, 1500, "On track", 1500],
    Sadaqah: [0, 1000, 0, "Done", 0], "Zakat set-aside": [0, 500, 0, "Done", 0], Miscellaneous: [0, 3800, -300, "Over budget", 0],
    "Emergency fund": [0, 8000, 0, "Done", 0], "Umrah fund": [0, 6000, 0, "Done", 0], "Laptop fund": [0, 3500, 0, "Done", 0],
  }));
});

describe("September (month 1)", () => {
  it("summary", () => {
    const s = summary(1);
    expect([s.received, s.actualOut, s.left, s.spentExSavings, s.saved]).toEqual([52000, 49100, 2900, 32500, 16600]);
    expect(Math.round(s.savingsRate! * 1000) / 10).toBe(31.9);
    expect(row(run().plan, 1, "Umrah fund").auto).toBe(6000);
  });
  it("tracker rows", () => checkRows(1, {
    Rent: [0, 15000, 0, "Done", 0], Groceries: [0, 6400, -400, "Over budget", 0], Transport: [0, 1000, 500, "On track", 0],
    "Personal spending": [0, 3600, -600, "Over budget", -600], "Medical buffer": [1500, 3000, 500, "On track", 500],
    Sadaqah: [0, 0, 1000, "Not started", 1000], "Zakat set-aside": [0, 500, 0, "Done", 0], Miscellaneous: [0, 3000, 500, "On track", 0],
    "Emergency fund": [600, 8600, 0, "Done", 0], "Umrah fund": [0, 6000, 0, "Done", 0], "Laptop fund": [0, 2000, 1500, "On track", 1500],
  }));
});

describe("October (month 2, in progress)", () => {
  it("summary and by-type table", () => {
    const s = summary(2);
    expect([s.received, s.actualOut, s.left, s.spentExSavings, s.saved, s.savingsRate]).toEqual([50000, 18200, 31800, 18200, 0, 0]);
    const pct = (n: number) => Math.round((n / s.received) * 100);
    expect(s.byType.Fixed).toEqual({ planned: 22500, actual: 17200 });
    expect(s.byType.Variable).toEqual({ planned: 8500, actual: 1000 });
    expect(s.byType.Giving).toEqual({ planned: 1500, actual: 0 });
    expect(s.byType.Savings).toEqual({ planned: 17500, actual: 0 });
    expect([pct(22500), pct(8500), pct(1500), pct(17500)]).toEqual([45, 17, 3, 35]);
  });
  it("tracker rows", () => checkRows(2, {
    Rent: [0, 15000, 0, "Done", 0], Groceries: [0, 1700, 4300, "On track", 0], Transport: [0, 500, 1000, "On track", 0],
    "Personal spending": [-600, 1000, 1400, "On track", 1400], "Medical buffer": [500, 0, 2500, "Not started", 2500],
    Sadaqah: [1000, 0, 2000, "Not started", 2000], "Zakat set-aside": [0, 0, 500, "Not started", 500], Miscellaneous: [0, 0, 3500, "Not started", 0],
    "Emergency fund": [0, 0, 8000, "Not started", 8000], "Umrah fund": [0, 0, 6000, "Not started", 6000], "Laptop fund": [1500, 0, 5000, "Not started", 5000],
  }));
});

describe("November (month 3)", () => {
  it("summary", () => {
    const s = summary(3);
    expect([s.received, s.actualOut, s.left]).toEqual([0, 15000, -15000]);
  });
  it("carry-in | actual | remaining", () => {
    const { plan } = run();
    const exp: Record<string, [number, number, number]> = {
      Rent: [0, 15000, 0], Groceries: [0, 0, 6000], Transport: [0, 0, 1500], "Personal spending": [0, 0, 3000],
      "Medical buffer": [2500, 0, 4500], Sadaqah: [2000, 0, 3000], "Zakat set-aside": [500, 0, 1000], Miscellaneous: [0, 0, 3500],
      "Emergency fund": [9400, 0, 17400], "Umrah fund": [6000, 0, 12000], "Laptop fund": [5000, 0, 8500],
    };
    for (const [n, [ci, a, rem]] of Object.entries(exp)) {
      const r = row(plan, 3, n);
      expect({ n, v: [r.carryIn, r.actual, r.remaining] }).toEqual({ n, v: [ci, a, rem] });
    }
  });
});

describe("goals (as of October)", () => {
  it("logged | auto | total | remaining | progress | plan | months", () => {
    const o = run();
    const g = Object.fromEntries(goalTotals(o.plan, o.goals, o.txs).map((x) => [x.goal.name, x]));
    const pick = (n: string) => { const x = g[n]!; return [x.savedFromLog, x.autoCounted, x.saved, x.remaining, Math.round(x.progress! * 1e6) / 1e6, x.monthlyPlan, x.monthsToGo]; };
    expect(pick("Emergency Fund")).toEqual([13600, 0, 18600, 41400, 31, 8000, 6]);
    expect(pick("Umrah")).toEqual([6000, 6000, 12000, 108000, 10, 6000, 18]);
    expect(pick("Laptop")).toEqual([5500, 0, 5500, 34500, 13.75, 3500, 10]);
    expect(Object.values(g).reduce((s, x) => s + x.saved, 0)).toBe(36100);
  });
});

const acc = (accounts = F.accounts) => accountTotals(accounts, F.incomeEntries, F.transactions, F.transfers);
describe("accounts", () => {
  it("calculated and usable balances", () => {
    const [main, sav] = acc();
    expect(F.incomeEntries.reduce((s, x) => s + x.amount, 0)).toBe(152000);
    expect(F.transactions.reduce((s, x) => s + x.amount, 0)).toBe(120400);
    expect([main!.calculated, main!.usable, sav!.calculated, sav!.usable]).toEqual([34100, 29100, 27500, 27500]);
    const t = acc();
    expect(t.reduce((s, x) => s + x.balance, 0)).toBe(61600);
    expect(t.reduce((s, x) => s + x.usable, 0)).toBe(56600);
  });
  it("actual 33,000 for Main bank shows difference -1,100 and is used in totals", () => {
    const t = acc([{ ...F.accounts[0]!, actual_balance: 33000 }, F.accounts[1]!]);
    expect(t[0]!.difference).toBe(-1100);
    expect(t[0]!.balance).toBe(33000);
    expect(t.reduce((s, x) => s + x.balance, 0)).toBe(60500);
  });
});

describe("recurring (3 Oct 2026)", () => {
  const t = (sel: string) => recurringTotals(F.recurring, F.TODAY, sel);
  it("next due, status, set-aside", () => {
    const m = Object.fromEntries(t("2026-10").map((x) => [x.item.name, x]));
    expect([m["Rent"]!.nextDue, m["Rent"]!.status, m["Rent"]!.monthlySetAside]).toEqual(["2026-11-01", "Upcoming", 15000]);
    expect([m["Internet"]!.nextDue, m["Internet"]!.status, m["Internet"]!.monthlySetAside, m["Internet"]!.daysUntil]).toEqual(["2026-10-05", "Due soon", 800, 2]);
    expect([m["Maintenance"]!.nextDue, m["Maintenance"]!.status, m["Maintenance"]!.monthlySetAside]).toEqual(["2026-11-10", "Upcoming", 1000]);
    expect([m["Takaful car insurance"]!.nextDue, m["Takaful car insurance"]!.status, m["Takaful car insurance"]!.monthlySetAside]).toEqual(["2026-12-20", "Upcoming", 1000]);
    expect([m["School fee"]!.nextDue, m["School fee"]!.status]).toEqual(["2026-11-15", "Upcoming"]);
  });
  it("total monthly equivalent 17,800", () => {
    expect(t("2026-10").reduce((s, x) => s + x.monthlySetAside, 0)).toBe(17800);
  });
  it("due in selected month", () => {
    const due = (sel: string) => t(sel).filter((x) => x.dueInSelectedMonth).reduce((s, x) => s + x.item.amount, 0);
    expect([due("2026-10"), due("2026-11"), due("2026-12")]).toEqual([15800, 23800, 27800]);
  });
});

describe("Zakat and interest", () => {
  it("Zakat", () => {
    const bank = acc().reduce((s, x) => s + x.balance, 0);
    const z = zakatCalc({ ...F.zakat, bankBalances: bank, transactions: F.transactions, today: F.TODAY });
    expect(z.nisab).toBeCloseTo(61236, 6);
    expect([z.bankBalances, z.assets, z.net, z.meetsNisab]).toEqual([61600, 121600, 121600, true]);
    expect(z.due).toBeCloseTo(3040, 6);
    expect(z.setAside).toBe(1000);
    expect(z.stillToSetAside).toBeCloseTo(2040, 6);
    expect([z.monthsToAnniversary, z.monthlySuggestion, z.daysToAnniversary]).toEqual([4, 510, 140]);
  });
  it("interest", () => {
    expect(interestTotals(F.interestReceived, F.interestGiven)).toEqual({ received: 120, given: 100, waiting: 20 });
  });
  it("Health Check (October): all good with one Note (interest waiting 20)", () => {
    const o = run();
    const gt = goalTotals(o.plan, o.goals, o.txs);
    const checks = healthChecks({
      today: F.TODAY, planStart: F.PLAN_START, selectedMonth: "2026-10-01", categories: F.categories,
      transactions: F.transactions, goals: F.goals, goalPlans: gt.map((g) => ({ id: g.goal.id, monthlyPlan: g.monthlyPlan, saved: g.saved })),
      recurring: F.recurring, incomeEntriesCount: 4, incomeSourcesCount: 2, accountsCount: 2, plannedIncome: F.PLANNED_INCOME,
      summary: summary(2), interestWaiting: 20, zakatAnniversary: F.zakat.anniversary_date,
    });
    expect(checks.filter((c) => c.level !== "ok").map((c) => [c.id, c.level])).toEqual([["interest-waiting", "note"]]);
  });
});

describe("variants", () => {
  it("E1: 15 Oct Umrah fund 9,000", () => {
    const o = run({ extra: [{ date: "2026-10-15", category_id: "Umrah fund", amount: 9000 }] });
    const oct = row(o.plan, 2, "Umrah fund");
    expect([oct.actual, oct.remaining, oct.status, oct.carryOut]).toEqual([9000, -3000, "Over budget", -3000]);
    const nov = row(o.plan, 3, "Umrah fund");
    expect([nov.carryIn, nov.available]).toEqual([-3000, 3000]);
    expect(goalTotals(o.plan, o.goals, o.txs).find((g) => g.goal.id === "Umrah")!.saved).toBe(21000);
    expect(trackerRows(o.plan, 2).filter((r) => r.status === "Over budget").length).toBe(1);
  });
  it("E2: 20 Oct Transport 3,000", () => {
    const o = run({ extra: [{ date: "2026-10-20", category_id: "Transport", amount: 3000 }] });
    const oct = row(o.plan, 2, "Transport");
    expect([oct.actual, oct.remaining, oct.status]).toEqual([3500, -2000, "Over budget"]);
    expect(row(o.plan, 3, "Transport").carryIn).toBe(0);
  });
  it("E3: 16 Oct Laptop fund -10,000", () => {
    const o = run({ extra: [{ date: "2026-10-16", category_id: "Laptop fund", amount: -10000 }] });
    const g = goalTotals(o.plan, o.goals, o.txs).find((x) => x.goal.id === "Laptop")!;
    expect([g.saved, g.progress, g.remaining]).toEqual([-4500, 0, 44500]);
    const r = row(o.plan, 2, "Laptop fund");
    expect([r.carryIn, r.remaining]).toEqual([1500, 5000]);
  });
  it("E4: Umrah auto-count off, then back on", () => {
    const off = F.goals.map((g) => (g.id === "Umrah" ? { ...g, auto_count: false } : g));
    const o = run({ goals: off });
    const g = goalTotals(o.plan, o.goals, o.txs).find((x) => x.goal.id === "Umrah")!;
    expect([g.saved, g.remaining, g.progress, g.monthsToGo]).toEqual([6000, 114000, 5, 19]);
    expect(row(o.plan, 2, "Umrah fund").carryIn).toBe(6000);
    const on = run();
    expect(goalTotals(on.plan, on.goals, on.txs).find((x) => x.goal.id === "Umrah")!.saved).toBe(12000);
  });
  it("E5: backdated 30 Aug Medical buffer 400", () => {
    const o = run({ extra: [{ date: "2026-08-30", category_id: "Medical buffer", amount: 400 }] });
    expect(row(o.plan, 0, "Medical buffer").remaining).toBe(1100);
    expect(row(o.plan, 1, "Medical buffer").carryIn).toBe(1100);
    const oct = row(o.plan, 2, "Medical buffer");
    expect([oct.carryIn, oct.available]).toEqual([100, 2100]);
    expect(row(o.plan, 3, "Medical buffer").carryIn).toBe(2100);
  });
  it("E6: today = 2 Nov 2026", () => {
    const o = run({ today: "2026-11-02" });
    expect(goalTotals(o.plan, o.goals, o.txs).find((x) => x.goal.id === "Umrah")!.saved).toBe(18000);
    const nov = row(o.plan, 3, "Umrah fund");
    expect([nov.carryIn, nov.available]).toEqual([0, 6000]);
  });
});

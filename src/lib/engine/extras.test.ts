import { describe, expect, it } from "vitest";
import { healthChecks, interestTotals, plannerTotals, zakatCalc, type HealthInput } from "./index";

const zbase = {
  basis: "Silver" as const, gold_grams: 87.48, silver_grams: 612.36, gold_price: 80, silver_price: 1,
  rate: 0.025, anniversary_date: "2026-12-15", zakat_category_id: "z", today: "2026-10-03",
  lines: [{ kind: "asset" as const, amount: 10000 }, { kind: "liability" as const, amount: 2000 }],
  transactions: [
    { date: "2026-03-01", category_id: "z", amount: 50 },
    { date: "2025-12-15", category_id: "z", amount: 999 }, // exactly 12 months before: excluded
    { date: "2026-12-15", category_id: "z", amount: 10 }, // on anniversary: included
    { date: "2026-04-01", category_id: "other", amount: 500 },
  ],
};

describe("zakat", () => {
  it("computes nisab, due, set aside and monthly suggestion", () => {
    const r = zakatCalc(zbase);
    expect(r.nisab).toBeCloseTo(612.36);
    expect(r.net).toBe(8000);
    expect(r.due).toBe(200);
    expect(r.setAside).toBe(60);
    expect(r.stillToSetAside).toBe(140);
    expect(r.monthsToAnniversary).toBe(2);
    expect(r.monthlySuggestion).toBe(70);
  });
  it("is zero when below nisab or no price entered", () => {
    expect(zakatCalc({ ...zbase, basis: "Gold", gold_price: 100 }).due).toBe(0); // nisab 8748 > 8000
    expect(zakatCalc({ ...zbase, silver_price: null }).due).toBe(0);
    expect(zakatCalc({ ...zbase, lines: [{ kind: "asset", amount: 500 }] }).due).toBe(0);
  });
});

describe("interest", () => {
  it("waiting never goes below zero", () => {
    expect(interestTotals([{ amount: 100 }], [{ amount: 30 }]).waiting).toBe(70);
    expect(interestTotals([{ amount: 10 }], [{ amount: 30 }]).waiting).toBe(0);
  });
});

describe("planner", () => {
  it("monthly set-aside spreads remaining over months until the event", () => {
    const r = plannerTotals({ start_date: "2027-02-18", items: [{ id: "1", name: "Iftar", planned: 600, spent: 0 }, { id: "2", name: "Eid", planned: 400, spent: 100 }] }, "2026-10-03");
    expect(r.monthsUntil).toBe(4);
    expect(r.monthlySetAside).toBe(225);
  });
});

describe("health checks", () => {
  const base: HealthInput = {
    today: "2026-10-03", planStart: "2026-10-01", selectedMonth: "2026-10-01",
    categories: [
      { id: "a", name: "Eid *gifts?", type: "Giving", planned: 100, leftover_mode: "move", leftover_category_id: null, goal_id: null },
      { id: "b", name: "Eid *gifts?", type: "Variable", planned: 100, leftover_mode: "same", leftover_category_id: null, goal_id: null },
      { id: "c", name: "Eid gifts", type: "Variable", planned: 100, leftover_mode: "same", leftover_category_id: null, goal_id: null },
    ],
    transactions: [{ date: "2029-01-01", category_id: null, amount: 0 }],
    goals: [], goalPlans: [], recurring: [], incomeEntriesCount: 0, incomeSourcesCount: 1, accountsCount: 0,
    plannedIncome: 200, summary: null, interestWaiting: 0, zakatAnniversary: null,
  };
  const byId = (id: string) => healthChecks(base).find((c) => c.id === id)!;
  it("flags problems with exact name matching", () => {
    expect(byId("duplicate-names").level).toBe("fix");
    expect(byId("duplicate-names").detail).toContain('"Eid *gifts?"');
    expect(byId("duplicate-names").detail).not.toContain('"Eid gifts"');
    expect(byId("unknown-category").level).toBe("fix");
    expect(byId("incomplete").level).toBe("fix");
    expect(byId("outside-window").level).toBe("fix");
    expect(byId("dest-missing").level).toBe("fix");
    expect(byId("over-planned").level).toBe("fix");
    expect(byId("zakat-anniversary").level).toBe("note");
    expect(byId("interest-waiting").level).toBe("ok");
  });
});

describe("test-scenario fixes", () => {
  it("counts bank balances in Zakat (scenario: due 3,040, still 2,040, 510/month, 140 days)", () => {
    const r = zakatCalc({
      basis: "Silver", gold_grams: 87.48, silver_grams: 612.36, gold_price: null, silver_price: 100, rate: 0.025,
      anniversary_date: "2027-02-20", zakat_category_id: "z", bankBalances: 61600,
      lines: [{ kind: "asset", amount: 10000 }, { kind: "asset", amount: 50000 }],
      transactions: [{ date: "2026-08-18", category_id: "z", amount: 500 }, { date: "2026-09-18", category_id: "z", amount: 500 }],
      today: "2026-10-03",
    });
    expect(r.assets).toBe(121600);
    expect(r.meetsNisab).toBe(true);
    expect(r.due).toBeCloseTo(3040);
    expect(r.stillToSetAside).toBeCloseTo(2040);
    expect(r.monthlySuggestion).toBe(510);
    expect(r.daysToAnniversary).toBe(140);
  });
  it("flags a goal whose withdrawals exceed deposits", () => {
    const base = {
      today: "2026-10-03", planStart: "2026-08-01", selectedMonth: "2026-10-01", categories: [], transactions: [],
      recurring: [], incomeEntriesCount: 1, incomeSourcesCount: 1, accountsCount: 1, plannedIncome: 0, summary: null,
      interestWaiting: 0, zakatAnniversary: null, goals: [{ id: "l", name: "Laptop", target: 40000 }],
    };
    const bad = healthChecks({ ...base, goalPlans: [{ id: "l", monthlyPlan: 3500, saved: -4500 }] }).find((c) => c.id === "goal-negative")!;
    expect(bad.level).toBe("note");
    const ok = healthChecks({ ...base, goalPlans: [{ id: "l", monthlyPlan: 3500, saved: 5500 }] }).find((c) => c.id === "goal-negative")!;
    expect(ok.level).toBe("ok");
  });
});

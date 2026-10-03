import { describe, it, expect } from "vitest";
import { validateCategoryName, validatePlanned } from "./budget-rules";
import { parseAmount, validateAccountName, isISODate } from "./parse";
import { findCategoryByName, healthChecks, resolveSelectedMonth, type HealthInput } from "./engine";

const START = "2026-01-01";

describe("very long names", () => {
  it("category names over 40 characters are rejected, 40 is allowed", () => {
    expect(validateCategoryName("ن".repeat(41), [])).toMatch(/40 characters/);
    expect(validateCategoryName("x".repeat(40), [])).toBeNull();
    expect(validateCategoryName("x".repeat(500), [])).not.toBeNull();
  });
  it("account names over 30 characters are rejected", () => {
    expect(validateAccountName("a".repeat(31), [])).toMatch(/30 characters/);
    expect(validateAccountName("a".repeat(30), [])).toBeNull();
  });
});

describe("emoji and Arabic names", () => {
  const cats = [
    { id: "1", name: "صدقة" },
    { id: "2", name: "Eid 🎉 gifts" },
    { id: "3", name: "زكاة الفطر" },
  ];
  it("are accepted as category names", () => {
    expect(validateCategoryName("صدقة جارية 🕌", cats)).toBeNull();
  });
  it("match exactly and literally", () => {
    expect(findCategoryByName(cats as never, "صدقة")?.id).toBe("1");
    expect(findCategoryByName(cats as never, "Eid 🎉 gifts")?.id).toBe("2");
    expect(findCategoryByName(cats as never, "Eid gifts")).toBeUndefined();
    expect(findCategoryByName(cats as never, "زكاة")).toBeUndefined();
  });
});

describe("duplicates", () => {
  const others = [{ id: "a", name: "صدقة" }, { id: "b", name: "Food" }];
  it("exact duplicates are rejected (including Arabic)", () => {
    expect(validateCategoryName("صدقة", others)).not.toBeNull();
    expect(validateCategoryName("  Food  ", others)).not.toBeNull();
    expect(validateAccountName("Food", others)).not.toBeNull();
  });
  it("different case is a different name", () => {
    expect(validateCategoryName("food", others)).toBeNull();
  });
});

describe("text in numeric fields", () => {
  it.each(["abc", "1,2,3", "", "  ", "12abc", "1.2.3", "--5", "NaN", "Infinity", "١٢٣"])("rejects %j", (v) => {
    expect(parseAmount(v)).toBeNull();
  });
  it("accepts plain numbers and rounds to 2 decimals", () => {
    expect(parseAmount("12")).toBe(12);
    expect(parseAmount(" -7.5 ")).toBe(-7.5);
    expect(parseAmount("1.005")).toBe(1);
  });
  it("planned must be a finite number >= 0", () => {
    expect(validatePlanned(Number("abc"))).not.toBeNull();
    expect(validatePlanned(-0.01)).not.toBeNull();
  });
  it("dates must be real calendar dates", () => {
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("tomorrow")).toBe(false);
    expect(isISODate("2026-02-28")).toBe(true);
  });
});

describe("invalid selected month", () => {
  it.each(["2025-12-01", "2028-01-01", "", "not a month"])("%j falls back to the first month and is flagged", (m) => {
    expect(resolveSelectedMonth(START, m)).toEqual({ k: 0, valid: false });
  });
  it("a month inside the plan is kept", () => {
    expect(resolveSelectedMonth(START, "2026-05-01")).toEqual({ k: 4, valid: true });
  });
  it("health check flags it as Fix", () => {
    const base: HealthInput = {
      today: "2026-03-01", planStart: START, selectedMonth: "2030-01-01", categories: [], transactions: [], goals: [],
      goalPlans: [], recurring: [], incomeEntriesCount: 0, incomeSourcesCount: 0, accountsCount: 0, plannedIncome: 0,
      summary: null, interestWaiting: 0, zakatAnniversary: null,
    };
    expect(healthChecks(base).find((c) => c.id === "selected-month")!.level).toBe("fix");
    expect(healthChecks({ ...base, selectedMonth: "2026-02-01" }).find((c) => c.id === "selected-month")!.level).toBe("ok");
  });
});

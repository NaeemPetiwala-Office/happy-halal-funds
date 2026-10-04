import { describe, expect, it } from "vitest";
import { SCENARIO, USER_TABLES } from "./dev-tools";

describe("test scenario data", () => {
  it("plans 50,000 against 50,000 income", () => {
    expect(SCENARIO.categories.reduce((s, c) => s + c.planned, 0)).toBe(50000);
    expect(SCENARIO.sources.reduce((s, c) => s + c.monthly_amount, 0)).toBe(50000);
  });
  it("starts 1 Aug 2026 in INR", () => {
    expect(SCENARIO.planStart).toBe("2026-08-01");
    expect(SCENARIO.currency).toBe("INR");
  });
  it("reset never touches the profile", () => {
    expect(USER_TABLES as readonly string[]).not.toContain("profiles");
    expect(USER_TABLES.length).toBe(14);
  });
});

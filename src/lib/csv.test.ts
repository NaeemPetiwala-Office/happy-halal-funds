import { describe, it, expect } from "vitest";
import { buildImportPreview, escapeCell, guessMapping, parseCSV, toCSV } from "./csv";

describe("CSV export", () => {
  it("neutralises formulas but keeps negative numbers", () => {
    expect(escapeCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(escapeCell("@cmd")).toBe("'@cmd");
    expect(escapeCell("+1 call")).toBe("'+1 call");
    expect(escapeCell("-25.5")).toBe("-25.5");
  });
  it("quotes commas, quotes and newlines and round-trips", () => {
    const csv = toCSV(["name", "note"], [['Eid *gifts?', 'He said "hi", ok\nnext'], ["صدقة 🕌", ""]]);
    expect(parseCSV(csv)).toEqual([["name", "note"], ["Eid *gifts?", 'He said "hi", ok\nnext'], ["صدقة 🕌", ""]]);
  });
});

describe("CSV import preview", () => {
  const cats = [{ id: "c1", name: "Food" }, { id: "c2", name: "Eid *gifts?" }];
  const accs = [{ id: "a1", name: "Cash" }];
  const inWindow = (d: string) => d >= "2026-01-01" && d < "2028-01-01";
  const rows = parseCSV("Date,Category,Amount,Account,Note\n2026-02-01,Food,12.50,Cash,lunch\n2026-02-02,food,5,,\n2026-02-03,Eid *gifts?,abc,,\n2025-01-01,Food,3,,\n2026-02-04,Eid *gifts?,-4,Bank,refund");
  const map = guessMapping(rows[0]!);
  const preview = buildImportPreview(rows.slice(1), map, cats, accs, inWindow);

  it("guesses the mapping from headers", () => {
    expect(map).toEqual({ date: 0, category: 1, amount: 2, account: 3, note: 4 });
  });
  it("flags unknown categories using exact names", () => {
    expect(preview.map((p) => p.status)).toEqual(["ok", "unknown-category", "invalid", "invalid", "ok"]);
    expect(preview[1]!.problem).toContain('"food"');
  });
  it("resolves ids and keeps negatives", () => {
    expect(preview[0]).toMatchObject({ category_id: "c1", account_id: "a1", amount: 12.5, note: "lunch" });
    expect(preview[4]).toMatchObject({ category_id: "c2", account_id: null, amount: -4 });
  });
});

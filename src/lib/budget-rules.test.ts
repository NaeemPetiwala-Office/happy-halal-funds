import { describe, it, expect } from "vitest";
import { validateCategoryName, validatePlanned, canAddCategory, unallocated } from "./budget-rules";

const others = [{ id: "a", name: "Rent" }];

describe("category rules", () => {
  it("rejects names over 40 characters", () => {
    expect(validateCategoryName("x".repeat(41), [])).not.toBeNull();
    expect(validateCategoryName("x".repeat(40), [])).toBeNull();
  });
  it("rejects reserved names", () => {
    expect(validateCategoryName("Same category", [])).not.toBeNull();
    expect(validateCategoryName("Drop it", [])).not.toBeNull();
  });
  it("rejects duplicates but allows renaming itself", () => {
    expect(validateCategoryName("Rent", others)).not.toBeNull();
    expect(validateCategoryName("Rent", others, "a")).toBeNull();
  });
  it("matches names literally", () => {
    expect(validateCategoryName("rent", others)).toBeNull();
    expect(validateCategoryName('Café * ? ~ " & < > = 🕌', others)).toBeNull();
  });
  it("planned must be >= 0", () => {
    expect(validatePlanned(-1)).not.toBeNull();
    expect(validatePlanned(0)).toBeNull();
  });
  it("allows at most 50 categories", () => {
    expect(canAddCategory(49)).toBe(true);
    expect(canAddCategory(50)).toBe(false);
  });
  it("unallocated is income minus planned", () => {
    expect(unallocated([1000, 500], [1200, 400])).toBe(-100);
  });
});

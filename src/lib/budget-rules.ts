export const MAX_CATEGORIES = 50;
export const MAX_CATEGORY_NAME = 40;
export const RESERVED_NAMES = ["Same category", "Drop it"];

/** Returns an error message, or null when the name is valid. Names match exactly and literally. */
export function validateCategoryName(
  name: string,
  others: { id: string; name: string }[],
  selfId?: string,
): string | null {
  const n = name.trim();
  if (!n) return "Name can't be empty.";
  if (n.length > MAX_CATEGORY_NAME) return `Name must be ${MAX_CATEGORY_NAME} characters or fewer.`;
  if (RESERVED_NAMES.includes(n)) return `"${n}" is reserved. Please choose another name.`;
  if (others.some((o) => o.id !== selfId && o.name === n)) return `A category named "${n}" already exists.`;
  return null;
}

export function validatePlanned(value: number): string | null {
  if (!Number.isFinite(value)) return "Planned must be a number.";
  if (value < 0) return "Planned can't be negative.";
  return null;
}

export function canAddCategory(count: number): boolean {
  return count < MAX_CATEGORIES;
}

export function unallocated(incomes: number[], planned: number[]): number {
  const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
  return Math.round((sum(incomes) - sum(planned)) * 100) / 100;
}

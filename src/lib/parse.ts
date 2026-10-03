/** Parse a user-typed money amount. Returns null for anything that isn't a plain number ("abc", "1,2,3", ""). */
export function parseAmount(raw: string | null | undefined): number | null {
  const s = (raw ?? "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Valid "YYYY-MM-DD" calendar date. */
export function isISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Account names: unique (exact), non-empty, at most 30 characters. */
export function validateAccountName(name: string, others: { id: string; name: string }[], selfId?: string): string | null {
  const n = name.trim();
  if (!n) return "Name can't be empty.";
  if (n.length > 30) return "Name must be 30 characters or fewer.";
  if (others.some((o) => o.id !== selfId && o.name === n)) return `An account named "${n}" already exists.`;
  return null;
}

import { isISODate, parseAmount } from "./parse";

/** Quote a cell and neutralise spreadsheet formulas (= + - @ tab CR at the start). */
export function escapeCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");
}

/** RFC 4180 parser: quoted fields, escaped quotes, newlines in quotes, CRLF. */
export function parseCSV(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (q) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export type ImportField = "date" | "category" | "amount" | "account" | "note";
export type Mapping = Partial<Record<ImportField, number>>;

/** Guess a column mapping from header names. */
export function guessMapping(headers: string[]): Mapping {
  const m: Mapping = {};
  const fields: ImportField[] = ["date", "category", "amount", "account", "note"];
  headers.forEach((h, i) => {
    const k = h.trim().toLowerCase();
    for (const f of fields) if (m[f] === undefined && k.includes(f)) m[f] = i;
  });
  return m;
}

export type PreviewStatus = "ok" | "unknown-category" | "invalid";
export interface PreviewRow {
  line: number;
  status: PreviewStatus;
  problem: string | null;
  date: string;
  categoryName: string;
  category_id: string | null;
  amount: number | null;
  account_id: string | null;
  accountName: string;
  note: string | null;
}

export function buildImportPreview(
  data: string[][],
  mapping: Mapping,
  categories: { id: string; name: string }[],
  accounts: { id: string; name: string }[],
  inWindow: (date: string) => boolean,
): PreviewRow[] {
  const get = (r: string[], f: ImportField) => (mapping[f] === undefined ? "" : (r[mapping[f]!] ?? "").trim());
  return data.map((r, i) => {
    const date = get(r, "date");
    const categoryName = get(r, "category");
    const amount = parseAmount(get(r, "amount"));
    const accountName = get(r, "account");
    const note = get(r, "note") || null;
    const cat = categories.find((c) => c.name === categoryName); // exact, literal
    const acc = accounts.find((a) => a.name === accountName);
    let status: PreviewStatus = "ok";
    let problem: string | null = null;
    if (!isISODate(date)) { status = "invalid"; problem = "Date must be YYYY-MM-DD."; }
    else if (amount === null || amount === 0) { status = "invalid"; problem = "Amount must be a non-zero number."; }
    else if (!inWindow(date)) { status = "invalid"; problem = "Date is outside your 24-month plan."; }
    else if (note && note.length > 200) { status = "invalid"; problem = "Note is longer than 200 characters."; }
    else if (!cat) { status = "unknown-category"; problem = categoryName ? `Unknown category "${categoryName}".` : "No category."; }
    return { line: i + 1, status, problem, date, categoryName, category_id: cat?.id ?? null, amount, account_id: acc?.id ?? null, accountName, note };
  });
}

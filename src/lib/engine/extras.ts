/**
 * Zakat, interest, health checks, optional planners and setup checklist.
 * Pure functions; everything derived from raw rows.
 */
import { monthIndex, PLAN_MONTHS, type ECategory, type MonthSummary } from "./index";

const EPS = 0.005;

function ymTotal(d: string) {
  return Number(d.slice(0, 4)) * 12 + Number(d.slice(5, 7)) - 1;
}
/** Shift a YYYY-MM-DD date by n months (day clamped). */
export function shiftMonths(date: string, n: number): string {
  const t = ymTotal(date) + n;
  const y = Math.floor(t / 12);
  const m = (t % 12) + 1;
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const d = Math.min(Number(date.slice(8, 10)), dim);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

/* ---------- Zakat ---------- */

export interface ZakatInput {
  basis: "Silver" | "Gold";
  gold_grams: number;
  silver_grams: number;
  gold_price: number | null;
  silver_price: number | null;
  rate: number;
  anniversary_date: string | null;
  zakat_category_id: string | null;
  lines: { kind: "asset" | "liability"; amount: number }[];
  transactions: { date: string; category_id: string | null; amount: number }[];
  today: string;
}
export interface ZakatResult {
  pricePerGram: number | null;
  nisab: number;
  assets: number;
  liabilities: number;
  net: number;
  meetsNisab: boolean;
  due: number;
  setAside: number;
  stillToSetAside: number;
  monthsToAnniversary: number | null;
  monthlySuggestion: number | null;
}

export function zakatCalc(z: ZakatInput): ZakatResult {
  const price = z.basis === "Gold" ? z.gold_price : z.silver_price;
  const grams = z.basis === "Gold" ? z.gold_grams : z.silver_grams;
  const nisab = price != null && price > 0 ? grams * price : 0;
  const assets = z.lines.filter((l) => l.kind === "asset").reduce((s, l) => s + Number(l.amount), 0);
  const liabilities = z.lines.filter((l) => l.kind === "liability").reduce((s, l) => s + Number(l.amount), 0);
  const net = Math.max(assets - liabilities, 0);
  const meetsNisab = nisab > 0 && net >= nisab;
  const due = meetsNisab ? z.rate * net : 0;
  let setAside = 0;
  let monthsToAnniversary: number | null = null;
  if (z.anniversary_date) {
    const from = shiftMonths(z.anniversary_date, -12);
    setAside = z.transactions
      .filter((t) => z.zakat_category_id && t.category_id === z.zakat_category_id && t.date > from && t.date <= z.anniversary_date!)
      .reduce((s, t) => s + Number(t.amount), 0);
    monthsToAnniversary = Math.max(ymTotal(z.anniversary_date) - ymTotal(z.today), 1);
  }
  const stillToSetAside = Math.max(due - setAside, 0);
  const monthlySuggestion = monthsToAnniversary == null ? null : Math.ceil(stillToSetAside / monthsToAnniversary);
  return { pricePerGram: price, nisab, assets, liabilities, net, meetsNisab, due, setAside, stillToSetAside, monthsToAnniversary, monthlySuggestion };
}

/* ---------- Interest ---------- */

export function interestTotals(received: { amount: number }[], given: { amount: number }[]) {
  const r = received.reduce((s, x) => s + Number(x.amount), 0);
  const g = given.reduce((s, x) => s + Number(x.amount), 0);
  return { received: r, given: g, waiting: Math.max(r - g, 0) };
}

/* ---------- Optional planners ---------- */

export interface PlannerItem { id: string; name: string; planned: number; spent: number }
export interface PlannerData { start_date?: string | null; end_date?: string | null; items?: PlannerItem[] }

export function plannerTotals(data: PlannerData, today: string) {
  const items = data.items ?? [];
  const planned = items.reduce((s, i) => s + Number(i.planned || 0), 0);
  const spent = items.reduce((s, i) => s + Number(i.spent || 0), 0);
  const remaining = Math.max(planned - spent, 0);
  const monthsUntil = data.start_date ? Math.max(ymTotal(data.start_date) - ymTotal(today), 0) : null;
  const monthlySetAside = monthsUntil == null ? null : remaining / Math.max(monthsUntil, 1);
  return { planned, spent, remaining, monthsUntil, monthlySetAside };
}

/* ---------- Health checks ---------- */

export type HealthLevel = "fix" | "note" | "ok";
export type HealthLink =
  | "/log" | "/budget" | "/goals" | "/recurring" | "/dashboard" | "/settings" | "/interest" | "/zakat" | "/income";
export interface HealthCheck {
  id: string;
  label: string;
  level: HealthLevel;
  detail: string;
  link: HealthLink;
}

export const LIMITS = { categories: 50, income_sources: 5, income_entries: 300, transactions: 1500, goals: 10, accounts: 10, recurring_items: 50 } as const;

export interface HealthInput {
  today: string;
  planStart: string;
  selectedMonth: string;
  categories: (Omit<ECategory, "type"> & { type: ECategory["type"] | null; notes?: string | null })[];
  transactions: { date: string | null; category_id: string | null; amount: number | null }[];
  goals: { id: string; name: string; target: number | null }[];
  goalPlans: { id: string; monthlyPlan: number }[];
  recurring: { name: string; category_id: string | null }[];
  incomeEntriesCount: number;
  incomeSourcesCount: number;
  accountsCount: number;
  plannedIncome: number;
  summary: MonthSummary | null;
  interestWaiting: number;
  zakatAnniversary: string | null;
}

export function healthChecks(h: HealthInput): HealthCheck[] {
  const out: HealthCheck[] = [];
  const add = (id: string, label: string, bad: boolean, level: "fix" | "note", detail: string, okDetail: string, link: HealthLink) =>
    out.push({ id, label, level: bad ? level : "ok", detail: bad ? detail : okDetail, link });
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

  const catIds = new Set(h.categories.map((c) => c.id));
  const goalIds = new Set(h.goals.map((g) => g.id));

  const unknownCat = h.transactions.filter((t) => !t.category_id || !catIds.has(t.category_id)).length;
  add("unknown-category", "Transactions with an unknown category", unknownCat > 0, "fix", `${plural(unknownCat, "transaction")} not linked to an existing category.`, "Every transaction has a category.", "/log");

  const incomplete = h.transactions.filter((t) => !t.date || t.amount == null || Number(t.amount) === 0).length;
  add("incomplete", "Incomplete transactions", incomplete > 0, "fix", `${plural(incomplete, "transaction")} missing a date or with a zero amount.`, "All transactions are complete.", "/log");

  const outside = h.transactions.filter((t) => {
    if (!t.date) return false;
    const k = monthIndex(h.planStart, t.date);
    return k < 0 || k >= PLAN_MONTHS;
  }).length;
  add("outside-window", "Dates outside the 24-month plan", outside > 0, "fix", `${plural(outside, "transaction")} dated outside your plan window, so they aren't counted.`, "All dates fall inside the plan.", "/log");

  const seen = new Map<string, number>();
  for (const c of h.categories) seen.set(c.name, (seen.get(c.name) ?? 0) + 1);
  const dups = [...seen].filter(([, n]) => n > 1).map(([n]) => n);
  add("duplicate-names", "Duplicate category names", dups.length > 0, "fix", `Used more than once: ${dups.map((d) => `"${d}"`).join(", ")}.`, "All category names are unique.", "/budget");

  const noType = h.categories.filter((c) => !c.type).length;
  add("no-type", "Categories without a type", noType > 0, "fix", `${plural(noType, "category")} need a type.`, "Every category has a type.", "/budget");

  const missingDest = h.categories.filter((c) => c.leftover_mode === "move" && (!c.leftover_category_id || !catIds.has(c.leftover_category_id)));
  add("dest-missing", "Leftover destination missing", missingDest.length > 0, "fix", `Leftovers stay in place for: ${missingDest.map((c) => `"${c.name}"`).join(", ")}.`, "All leftover destinations exist.", "/budget");

  const missingGoal = h.categories.filter((c) => c.goal_id && !goalIds.has(c.goal_id));
  add("goal-missing", "Goal link missing", missingGoal.length > 0, "fix", `Linked to a goal that no longer exists: ${missingGoal.map((c) => `"${c.name}"`).join(", ")}.`, "All goal links are valid.", "/budget");

  const badRec = h.recurring.filter((r) => !r.category_id || !catIds.has(r.category_id));
  add("recurring-category", "Recurring items with unknown category", badRec.length > 0, "fix", `${badRec.map((r) => `"${r.name}"`).join(", ")} need a category.`, "Every recurring item has a category.", "/recurring");

  const sk = monthIndex(h.planStart, h.selectedMonth);
  add("selected-month", "Selected month", sk < 0 || sk >= PLAN_MONTHS, "fix", "The selected month is outside your plan. Pick a month again.", "The selected month is inside your plan.", "/dashboard");

  const plannedOut = h.categories.reduce((s, c) => s + Number(c.planned), 0);
  const over = plannedOut - h.plannedIncome;
  add("over-planned", "Planned spending vs income", h.plannedIncome > 0 && over > EPS, "fix", `You've planned ${over.toFixed(2)} more than your monthly income.`, "Planned spending fits your income.", "/budget");

  const unalloc = h.plannedIncome - plannedOut;
  add("unallocated", "Unallocated income", unalloc > EPS, "note", `${unalloc.toFixed(2)} of monthly income has no category yet.`, "All planned income is allocated.", "/budget");

  add("no-income", "Income entered", h.incomeEntriesCount === 0, "note", "No income has been recorded yet.", "Income has been recorded.", "/income");

  const noPlan = h.goalPlans.filter((g) => g.monthlyPlan <= 0).map((g) => h.goals.find((x) => x.id === g.id)?.name ?? "");
  add("goal-no-plan", "Goals without a monthly plan", noPlan.length > 0, "note", `Link a category to: ${noPlan.map((n) => `"${n}"`).join(", ")}.`, "Every goal has a monthly plan.", "/goals");

  const noTarget = h.goals.filter((g) => g.target == null);
  add("goal-no-target", "Goals without a target", noTarget.length > 0, "note", `No target set for: ${noTarget.map((g) => `"${g.name}"`).join(", ")}.`, "Every goal has a target.", "/goals");

  const sample = h.categories.filter((c) => c.notes === "Sample data").length;
  add("sample-data", "Sample data", sample > 0, "note", `${plural(sample, "sample category")} still in your plan. Delete them when you're ready.`, "No sample data left.", "/budget");

  const counts: [string, number, number][] = [
    ["categories", h.categories.length, LIMITS.categories],
    ["transactions", h.transactions.length, LIMITS.transactions],
    ["income entries", h.incomeEntriesCount, LIMITS.income_entries],
    ["income sources", h.incomeSourcesCount, LIMITS.income_sources],
    ["goals", h.goals.length, LIMITS.goals],
    ["accounts", h.accountsCount, LIMITS.accounts],
    ["recurring items", h.recurring.length, LIMITS.recurring_items],
  ];
  const near = counts.filter(([, n, max]) => n >= max * 0.9);
  add("capacity", "Data capacity", near.length > 0, "note", `Nearly full: ${near.map(([l, n, m]) => `${l} (${n}/${m})`).join(", ")}.`, "Plenty of room left.", near[0]?.[0] === "transactions" ? "/log" : "/budget");

  add("interest-waiting", "Interest waiting to give", h.interestWaiting > EPS, "note", `${h.interestWaiting.toFixed(2)} of interest received hasn't been given away yet.`, "No interest waiting.", "/interest");

  const days = h.zakatAnniversary ? daysBetween(h.today, h.zakatAnniversary) : null;
  add(
    "zakat-anniversary",
    "Zakat anniversary",
    days == null || (days >= 0 && days <= 30),
    "note",
    days == null ? "No Zakat anniversary date set." : `Your Zakat anniversary is in ${plural(days, "day")}.`,
    "Zakat anniversary is set and not imminent.",
    "/zakat",
  );

  return out;
}

/* ---------- Setup checklist ---------- */

export interface SetupStep { id: string; label: string; done: boolean; link: "/budget" | "/accounts" | "/goals" | "/income" | "/log" }
export function setupChecklist(c: {
  incomeSources: number; categories: number; unallocated: number; accounts: number; goals: number; transactions: number; incomeEntries: number;
}): SetupStep[] {
  return [
    { id: "income-source", label: "Add an income source", done: c.incomeSources > 0, link: "/budget" },
    { id: "categories", label: "Create budget categories", done: c.categories > 0, link: "/budget" },
    { id: "allocate", label: "Give every bit of income a category", done: c.incomeSources > 0 && c.categories > 0 && Math.abs(c.unallocated) <= EPS, link: "/budget" },
    { id: "account", label: "Add an account", done: c.accounts > 0, link: "/accounts" },
    { id: "goal", label: "Set a savings goal", done: c.goals > 0, link: "/goals" },
    { id: "income", label: "Record income received", done: c.incomeEntries > 0, link: "/income" },
    { id: "transaction", label: "Log your first transaction", done: c.transactions > 0, link: "/log" },
  ];
}

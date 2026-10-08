/**
 * Pure budgeting engine. Implements the Core rules from Project Knowledge.
 * Everything here is derived from raw rows; nothing is stored.
 */

export type CategoryType = "Fixed" | "Variable" | "Giving" | "Savings";
export const CATEGORY_TYPES: CategoryType[] = ["Fixed", "Variable", "Giving", "Savings"];

export interface ECategory {
  id: string;
  name: string;
  type: CategoryType;
  planned: number;
  leftover_mode: "same" | "drop" | "move";
  leftover_category_id: string | null;
  goal_id: string | null;
}
export interface ETransaction {
  date: string; // YYYY-MM-DD
  category_id: string | null;
  amount: number;
}
export interface EGoal {
  id: string;
  name: string;
  target: number | null;
  opening_saved: number;
  auto_count: boolean;
}
export interface EIncomeEntry {
  date: string;
  amount: number;
}

export const PLAN_MONTHS = 24;
const EPS = 0.005;

export interface MonthCell {
  planned: number;
  carryIn: number;
  actualBase: number;
  auto: number;
  left: number;
  outPos: number;
}

export interface Plan {
  planStart: string; // YYYY-MM-01
  today: string; // YYYY-MM-DD
  months: string[]; // "YYYY-MM" x 24
  categories: ECategory[];
  /** cells[categoryId][k] */
  cells: Record<string, MonthCell[]>;
}

/* ---------- dates ---------- */

function ym(d: string): [number, number] {
  return [Number(d.slice(0, 4)), Number(d.slice(5, 7))];
}
/** Month offset of a date from plan start (may be negative or >= 24). */
export function monthIndex(planStart: string, date: string): number {
  const [y0, m0] = ym(planStart);
  const [y, m] = ym(date);
  return (y - y0) * 12 + (m - m0);
}
/** Plan start is always the 1st of its month ("2026-08-17" -> "2026-08-01"). */
export function normalizePlanStart(date: string): string {
  return `${date.slice(0, 7)}-01`;
}
/** "YYYY-MM" of month k. */
export function monthKey(planStart: string, k: number): string {
  const [y0, m0] = ym(planStart);
  const t = y0 * 12 + (m0 - 1) + k;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}
/** First day of month k+1, as YYYY-MM-DD. */
export function monthEnd(planStart: string, k: number): string {
  return `${monthKey(planStart, k + 1)}-01`;
}

/* ---------- names ---------- */

/** Names match exactly and literally — no trimming, case folding or wildcards. */
export function findCategoryByName<T extends { name: string }>(cats: T[], name: string): T | undefined {
  return cats.find((c) => c.name === name);
}

/* ---------- core ---------- */

/** Target(c): null when dropped; c itself for same or missing destination; else destination id. */
export function targetOf(c: ECategory, ids: Set<string>): string | null {
  if (c.leftover_mode === "drop") return null;
  if (c.leftover_mode === "same" || !c.leftover_category_id || !ids.has(c.leftover_category_id)) return c.id;
  return c.leftover_category_id;
}

export function computePlan(input: {
  planStart: string;
  today: string;
  categories: ECategory[];
  transactions: ETransaction[];
  goals: EGoal[];
}): Plan {
  const { today, categories, transactions, goals } = input;
  const planStart = normalizePlanStart(input.planStart);
  const ids = new Set(categories.map((c) => c.id));
  const goalById = new Map(goals.map((g) => [g.id, g]));
  const target = new Map(categories.map((c) => [c.id, targetOf(c, ids)]));

  // ActualBase per category per month
  const base: Record<string, number[]> = {};
  for (const c of categories) base[c.id] = Array(PLAN_MONTHS).fill(0);
  const typeOf = new Map(categories.map((c) => [c.id, c.type]));
  for (const t of transactions) {
    if (!t.category_id || !ids.has(t.category_id)) continue;
    const k = monthIndex(planStart, t.date);
    if (k < 0 || k >= PLAN_MONTHS) continue;
    const amt = Number(t.amount);
    if (typeOf.get(t.category_id) === "Savings" && amt < 0) continue; // withdrawals ignored
    base[t.category_id]![k]! += amt;
  }

  const cells: Record<string, MonthCell[]> = {};
  for (const c of categories) cells[c.id] = [];

  for (let k = 0; k < PLAN_MONTHS; k++) {
    const ended = monthEnd(planStart, k) <= today;
    for (const c of categories) {
      let carryIn = 0;
      if (k > 0) {
        const prev = cells[c.id]![k - 1]!;
        if (target.get(c.id) !== null) carryIn += Math.min(prev.left, 0);
        for (const s of categories) {
          if (target.get(s.id) === c.id) carryIn += cells[s.id]![k - 1]!.outPos;
        }
      }
      const planned = Number(c.planned);
      const actualBase = base[c.id]![k]!;
      const goal = c.goal_id ? goalById.get(c.goal_id) : undefined;
      const auto = goal?.auto_count && ended ? Math.max(planned + carryIn - actualBase, 0) : 0;
      const left = planned + carryIn - actualBase - auto;
      const outPos = target.get(c.id) !== null ? Math.max(left, 0) : 0;
      cells[c.id]!.push({ planned, carryIn, actualBase, auto, left, outPos });
    }
  }

  return {
    planStart,
    today,
    months: Array.from({ length: PLAN_MONTHS }, (_, k) => monthKey(planStart, k)),
    categories,
    cells,
  };
}

/* ---------- tracker ---------- */

export type Status = "Over budget" | "Ahead of plan" | "Not started" | "Done" | "Near limit" | "On track";

export interface TrackerRow {
  category: ECategory;
  planned: number;
  carryIn: number;
  available: number;
  actual: number;
  remaining: number;
  pctUsed: number;
  status: Status;
  carryOut: number;
  auto: number;
}

/** BRL-10: a Savings category funded above its plan is "Ahead of plan"; any other overspend is "Over budget". */
export function statusOf(available: number, actual: number, remaining: number, pct: number, type?: string): Status {
  if (remaining < -EPS) return type === "Savings" ? "Ahead of plan" : "Over budget";
  if (Math.abs(actual) < EPS) return "Not started";
  if (Math.abs(remaining) < EPS) return "Done";
  if (pct >= 90) return "Near limit";
  return "On track";
}

export function trackerRows(plan: Plan, k: number): TrackerRow[] {
  return plan.categories.map((c) => {
    const cell = plan.cells[c.id]![k]!;
    const available = cell.planned + cell.carryIn;
    const actual = cell.actualBase + cell.auto;
    const remaining = available - actual;
    const pctUsed = available > 0 ? (actual / available) * 100 : actual > 0 ? 100 : 0;
    return {
      category: c,
      planned: cell.planned,
      carryIn: cell.carryIn,
      available,
      actual,
      remaining,
      pctUsed,
      status: statusOf(available, actual, remaining, pctUsed, c.type),
      carryOut: c.leftover_mode === "drop" ? 0 : remaining,
      auto: cell.auto,
    };
  });
}

/* ---------- month summary ---------- */

export interface MonthSummary {
  received: number;
  plannedIncome: number;
  plannedOut: number;
  actualOut: number;
  spentExSavings: number;
  saved: number;
  left: number;
  savingsRate: number | null;
  byType: Record<CategoryType, { planned: number; actual: number }>;
}

export function monthSummary(
  plan: Plan,
  k: number,
  incomeEntries: EIncomeEntry[],
  plannedIncome: number,
): MonthSummary {
  const key = plan.months[k];
  const received = incomeEntries
    .filter((e) => key && e.date.startsWith(key))
    .reduce((s, e) => s + Number(e.amount), 0);
  const byType = Object.fromEntries(CATEGORY_TYPES.map((t) => [t, { planned: 0, actual: 0 }])) as MonthSummary["byType"];
  for (const r of trackerRows(plan, k)) {
    byType[r.category.type].planned += r.planned;
    byType[r.category.type].actual += r.actual;
  }
  const plannedOut = CATEGORY_TYPES.reduce((s, t) => s + byType[t].planned, 0);
  const actualOut = CATEGORY_TYPES.reduce((s, t) => s + byType[t].actual, 0);
  const saved = byType.Savings.actual;
  const denom = received > 0 ? received : plannedIncome;
  return {
    received,
    plannedIncome,
    plannedOut,
    actualOut,
    spentExSavings: actualOut - saved,
    saved,
    left: received - actualOut,
    savingsRate: denom > 0 ? saved / denom : null,
    byType,
  };
}

/* ---------- goals ---------- */

export interface GoalTotal {
  goal: EGoal;
  savedFromLog: number;
  autoCounted: number;
  saved: number;
  remaining: number | null;
  progress: number | null; // 0..100
  monthlyPlan: number;
  monthsToGo: number | null;
  estimatedCompletion: string | null; // YYYY-MM
}

export function goalTotals(plan: Plan, goals: EGoal[], transactions: ETransaction[]): GoalTotal[] {
  return goals.map((g) => {
    const linked = plan.categories.filter((c) => c.goal_id === g.id);
    const linkedIds = new Set(linked.map((c) => c.id));
    const txSum = transactions
      .filter((t) => t.category_id && linkedIds.has(t.category_id))
      .reduce((s, t) => s + Number(t.amount), 0);
    const autoSum = linked.reduce((s, c) => s + plan.cells[c.id]!.reduce((a, x) => a + x.auto, 0), 0);
    const saved = Number(g.opening_saved) + txSum + autoSum;
    const monthlyPlan = linked.reduce((s, c) => s + Number(c.planned), 0);
    const target = g.target == null ? null : Number(g.target);
    const remaining = target == null ? null : Math.max(target - saved, 0);
    const progress = target == null || target <= 0 ? null : Math.min(Math.max((saved / target) * 100, 0), 100);
    const monthsToGo = remaining == null || monthlyPlan <= 0 ? null : Math.ceil(remaining / monthlyPlan - 1e-9);
    let estimatedCompletion: string | null = null;
    if (monthsToGo != null) {
      const [y, m] = ym(plan.today);
      const t = y * 12 + (m - 1) + monthsToGo;
      estimatedCompletion = `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
    }
    return { goal: g, savedFromLog: txSum, autoCounted: autoSum, saved, remaining, progress, monthlyPlan, monthsToGo, estimatedCompletion };
  });
}

/* ---------- accounts ---------- */

export interface EAccount {
  id: string;
  name: string;
  opening_balance: number;
  minimum_balance: number;
  actual_balance: number | null;
}
export interface EAccountEntry { account_id: string | null; amount: number }
export interface ETransfer { from_account_id: string | null; to_account_id: string | null; amount: number }
export interface AccountTotal {
  account: EAccount;
  calculated: number;
  balance: number;
  difference: number | null;
  usable: number;
}

export function accountTotals(
  accounts: EAccount[],
  incomeEntries: EAccountEntry[],
  transactions: EAccountEntry[],
  transfers: ETransfer[],
): AccountTotal[] {
  return accounts.map((account) => {
    const income = incomeEntries.filter((x) => x.account_id === account.id).reduce((s, x) => s + Number(x.amount), 0);
    const spending = transactions.filter((x) => x.account_id === account.id).reduce((s, x) => s + Number(x.amount), 0);
    const transfersIn = transfers.filter((x) => x.to_account_id === account.id).reduce((s, x) => s + Number(x.amount), 0);
    const transfersOut = transfers.filter((x) => x.from_account_id === account.id).reduce((s, x) => s + Number(x.amount), 0);
    const calculated = Number(account.opening_balance) + income - spending + transfersIn - transfersOut;
    const actual = account.actual_balance == null ? null : Number(account.actual_balance);
    const balance = actual ?? calculated;
    return {
      account,
      calculated,
      balance,
      difference: actual == null ? null : actual - calculated,
      usable: Math.max(balance - Number(account.minimum_balance), 0),
    };
  });
}

/* ---------- recurring payments ---------- */

export type RecurringFrequency = "Monthly" | "Quarterly" | "Half-yearly" | "Yearly" | "One-time";
export interface ERecurringItem {
  id: string;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  first_due_date: string;
  category_id: string | null;
  active: boolean;
}
export type RecurringStatus = "Inactive" | "Due today" | "Due soon" | "Upcoming" | "Completed";
export interface RecurringTotal {
  item: ERecurringItem;
  nextDue: string | null;
  daysUntil: number | null;
  status: RecurringStatus;
  monthlySetAside: number;
  dueInSelectedMonth: boolean;
}

export function recurringStepMonths(frequency: RecurringFrequency): number {
  return { Monthly: 1, Quarterly: 3, "Half-yearly": 6, Yearly: 12, "One-time": 0 }[frequency];
}

function dateParts(iso: string): [number, number, number] {
  return [Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), Number(iso.slice(8, 10))];
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonthsClamped(iso: string, months: number): string {
  const [year, month, day] = dateParts(iso);
  const absolute = year * 12 + month - 1 + months;
  const nextYear = Math.floor(absolute / 12);
  const nextMonth = (absolute % 12) + 1;
  const nextDay = Math.min(day, daysInMonth(nextYear, nextMonth));
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
}

export function nextRecurringDue(item: ERecurringItem, today: string): string | null {
  if (!item.active) return null;
  if (item.frequency === "One-time") return item.first_due_date >= today ? item.first_due_date : null;
  if (item.first_due_date >= today) return item.first_due_date;
  const step = recurringStepMonths(item.frequency);
  const [fy, fm] = ym(item.first_due_date);
  const [ty, tm] = ym(today);
  let jumps = Math.max(0, Math.floor(((ty - fy) * 12 + tm - fm) / step));
  let candidate = addMonthsClamped(item.first_due_date, jumps * step);
  while (candidate < today) {
    jumps += 1;
    candidate = addMonthsClamped(item.first_due_date, jumps * step);
  }
  return candidate;
}

export function recurringDueInMonth(item: ERecurringItem, selectedMonth: string): boolean {
  if (!item.active || selectedMonth < item.first_due_date.slice(0, 7)) return false;
  if (item.frequency === "One-time") return item.first_due_date.startsWith(selectedMonth);
  const offset = monthIndex(`${item.first_due_date.slice(0, 7)}-01`, `${selectedMonth}-01`);
  return offset >= 0 && offset % recurringStepMonths(item.frequency) === 0;
}

export function recurringTotals(items: ERecurringItem[], today: string, selectedMonth: string): RecurringTotal[] {
  return items.map((item) => {
    const nextDue = nextRecurringDue(item, today);
    const daysUntil = nextDue == null ? null : Math.round((Date.parse(`${nextDue}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
    const step = recurringStepMonths(item.frequency);
    const monthlySetAside = item.active && step > 0 ? Number(item.amount) / step : 0;
    const status: RecurringStatus = !item.active ? "Inactive" : nextDue == null ? "Completed" : daysUntil === 0 ? "Due today" : (daysUntil ?? 8) <= 7 ? "Due soon" : "Upcoming";
    return { item, nextDue, daysUntil, status, monthlySetAside, dueInSelectedMonth: recurringDueInMonth(item, selectedMonth) };
  });
}

/* ---------- alerts ---------- */

export interface Alert {
  level: "fix" | "note";
  message: string;
}

export function monthAlerts(plan: Plan, k: number, summary: MonthSummary, goals: GoalTotal[]): Alert[] {
  const out: Alert[] = [];
  const rows = trackerRows(plan, k);
  for (const r of rows.filter((r) => r.status === "Over budget"))
    out.push({ level: "fix", message: `"${r.category.name}" is over budget by ${(-r.remaining).toFixed(2)}.` });
  for (const r of rows.filter((r) => r.status === "Near limit"))
    out.push({ level: "note", message: `"${r.category.name}" has used ${Math.round(r.pctUsed)}% of its budget.` });
  if (summary.plannedIncome > 0 && summary.plannedOut > summary.plannedIncome + EPS)
    out.push({ level: "fix", message: "Planned spending is greater than your planned income." });
  else if (summary.plannedIncome - summary.plannedOut > EPS)
    out.push({ level: "note", message: "Some planned income isn't allocated to a category yet." });
  if (summary.received <= 0) out.push({ level: "note", message: "No income recorded for this month yet." });
  for (const g of goals) {
    if (g.monthlyPlan <= 0) out.push({ level: "note", message: `Goal "${g.goal.name}" has no monthly plan.` });
    if (g.goal.target == null) out.push({ level: "note", message: `Goal "${g.goal.name}" has no target.` });
  }
  return out;
}
export * from "./extras";

/** Selected month index; anything invalid or outside the plan falls back to the first month and is flagged. */
export function resolveSelectedMonth(planStart: string, selected: string | null | undefined): { k: number; valid: boolean } {
  if (!selected || !/^\d{4}-\d{2}/.test(selected)) return { k: 0, valid: false };
  const k = monthIndex(planStart, selected);
  if (!Number.isFinite(k) || k < 0 || k >= PLAN_MONTHS) return { k: 0, valid: false };
  return { k, valid: true };
}

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
  const { planStart, today, categories, transactions, goals } = input;
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

export type Status = "Over budget" | "Not started" | "Done" | "Near limit" | "On track";

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

export function statusOf(available: number, actual: number, remaining: number, pct: number): Status {
  if (remaining < -EPS) return "Over budget";
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
      status: statusOf(available, actual, remaining, pctUsed),
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
    return { goal: g, saved, remaining, progress, monthlyPlan, monthsToGo, estimatedCompletion };
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

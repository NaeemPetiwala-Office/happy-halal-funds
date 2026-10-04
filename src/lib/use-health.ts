import { useQuery } from "@tanstack/react-query";
import {
  accountsQuery, categoriesQuery, incomeSourcesQuery, interestGivenQuery, interestReceivedQuery,
  recurringItemsQuery, transactionsQuery, zakatSettingsQuery,
} from "./data";
import { healthChecks, interestTotals, recurringTotals, type HealthCheck } from "./engine";
import { todayISO } from "./format";
import { usePlan } from "./use-plan";

/** Health checks plus the extra counts the Dashboard alerts need. Shared by Health and Dashboard. */
export function useHealth(): null | { checks: HealthCheck[]; interestWaiting: number; dueSoon: number } {
  const p = usePlan();
  const cats = useQuery(categoriesQuery).data ?? [];
  const txs = useQuery(transactionsQuery).data ?? [];
  const rec = useQuery(recurringItemsQuery).data ?? [];
  const accounts = useQuery(accountsQuery).data ?? [];
  const sources = useQuery(incomeSourcesQuery).data ?? [];
  const ir = useQuery(interestReceivedQuery).data ?? [];
  const ig = useQuery(interestGivenQuery).data ?? [];
  const zs = useQuery(zakatSettingsQuery).data;
  if (p.loading) return null;
  const today = todayISO();
  const interestWaiting = interestTotals(ir, ig).waiting;
  const checks = healthChecks({
    today,
    planStart: p.profile.plan_start,
    selectedMonth: p.profile.selected_month,
    categories: cats.map((c) => ({ ...c, planned: Number(c.planned) })),
    transactions: txs.map((t) => ({ ...t, amount: Number(t.amount) })),
    goals: p.goals.map((g) => ({ id: g.goal.id, name: g.goal.name, target: g.goal.target })),
    goalPlans: p.goals.map((g) => ({ id: g.goal.id, monthlyPlan: g.monthlyPlan, saved: g.saved })),
    recurring: rec,
    incomeEntriesCount: p.incomeEntries.length,
    incomeSourcesCount: sources.length,
    accountsCount: accounts.length,
    plannedIncome: p.plannedIncome,
    summary: p.summary,
    interestWaiting,
    zakatAnniversary: zs?.anniversary_date ?? null,
  });
  const dueSoon = recurringTotals(
    rec.map((r) => ({ ...r, amount: Number(r.amount) })),
    today,
    p.plan.months[p.k]!,
  ).filter((r) => r.status === "Due soon" || r.status === "Due today").length;
  return { checks, interestWaiting, dueSoon };
}

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileQuery } from "./profile";
import { categoriesQuery, goalsQuery, incomeEntriesQuery, incomeSourcesQuery, transactionsQuery } from "./data";
import { computePlan, goalTotals, monthIndex, monthSummary, PLAN_MONTHS } from "./engine";
import { todayISO } from "./format";

/** Loads raw rows and derives the whole plan for the globally selected month. */
export function usePlan() {
  const profile = useQuery(profileQuery);
  const cats = useQuery(categoriesQuery);
  const txs = useQuery(transactionsQuery);
  const goals = useQuery(goalsQuery);
  const income = useQuery(incomeEntriesQuery);
  const sources = useQuery(incomeSourcesQuery);
  const loading = [profile, cats, txs, goals, income, sources].some((q) => q.isLoading);

  return useMemo(() => {
    const p = profile.data;
    if (loading || !p) return { loading: true as const };
    const today = todayISO();
    const normGoals = (goals.data ?? []).map((g) => ({
      ...g,
      target: g.target == null ? null : Number(g.target),
      opening_saved: Number(g.opening_saved),
    }));
    const plan = computePlan({
      planStart: p.plan_start,
      today,
      categories: (cats.data ?? []).map((c) => ({ ...c, planned: Number(c.planned) })),
      transactions: txs.data ?? [],
      goals: normGoals,
    });
    const rawK = monthIndex(p.plan_start, p.selected_month);
    const monthValid = rawK >= 0 && rawK < PLAN_MONTHS;
    const k = Math.min(Math.max(rawK, 0), PLAN_MONTHS - 1);
    const plannedIncome = (sources.data ?? []).reduce((s, x) => s + Number(x.monthly_amount), 0);
    const incomeEntries = income.data ?? [];
    return {
      loading: false as const,
      profile: p,
      currency: p.currency,
      plan,
      k,
      monthValid,
      plannedIncome,
      incomeEntries,
      summary: monthSummary(plan, k, incomeEntries, plannedIncome),
      goals: goalTotals(plan, normGoals, txs.data ?? []),
    };
  }, [loading, profile.data, cats.data, txs.data, goals.data, income.data, sources.data]);
}

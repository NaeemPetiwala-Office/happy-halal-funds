import { createFileRoute, Link } from "@tanstack/react-router";
import { PageSkeleton } from "@/components/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import {
  accountsQuery, categoriesQuery, incomeSourcesQuery, interestGivenQuery, interestReceivedQuery,
  recurringItemsQuery, transactionsQuery, zakatSettingsQuery,
} from "@/lib/data";
import { healthChecks, interestTotals, type HealthLevel } from "@/lib/engine";
import { todayISO } from "@/lib/format";
import { usePlan } from "@/lib/use-plan";

export const Route = createFileRoute("/_authenticated/_app/health")({
  head: () => ({
    meta: [
      { title: "Health check — Halal Budget Planner" },
      { name: "description", content: "Find and fix mistakes in your plan, with a link to each problem." },
      { property: "og:title", content: "Health check — Halal Budget Planner" },
      { property: "og:description", content: "Find and fix mistakes in your plan, with a link to each problem." },
    ],
  }),
  component: Page,
});

const BADGE: Record<HealthLevel, string> = {
  fix: "bg-destructive/15 text-destructive",
  note: "bg-accent/25 text-accent-foreground dark:text-accent",
  ok: "bg-secondary text-secondary-foreground",
};
const LABEL: Record<HealthLevel, string> = { fix: "Fix", note: "Note", ok: "OK" };

function Page() {
  const p = usePlan();
  const cats = useQuery(categoriesQuery).data ?? [];
  const txs = useQuery(transactionsQuery).data ?? [];
  const rec = useQuery(recurringItemsQuery).data ?? [];
  const accounts = useQuery(accountsQuery).data ?? [];
  const sources = useQuery(incomeSourcesQuery).data ?? [];
  const ir = useQuery(interestReceivedQuery).data ?? [];
  const ig = useQuery(interestGivenQuery).data ?? [];
  const zs = useQuery(zakatSettingsQuery).data;

  if (p.loading) return <><PageHeader eyebrow="Keep things right" title="Health check" /><PageSkeleton /></>;

  const checks = healthChecks({
    today: todayISO(),
    planStart: p.profile.plan_start,
    selectedMonth: p.profile.selected_month,
    categories: cats.map((c) => ({ ...c, planned: Number(c.planned) })),
    transactions: txs.map((t) => ({ ...t, amount: Number(t.amount) })),
    goals: p.goals.map((g) => ({ id: g.goal.id, name: g.goal.name, target: g.goal.target })),
    goalPlans: p.goals.map((g) => ({ id: g.goal.id, monthlyPlan: g.monthlyPlan })),
    recurring: rec,
    incomeEntriesCount: p.incomeEntries.length,
    incomeSourcesCount: sources.length,
    accountsCount: accounts.length,
    plannedIncome: p.plannedIncome,
    summary: p.summary,
    interestWaiting: interestTotals(ir, ig).waiting,
    zakatAnniversary: zs?.anniversary_date ?? null,
  });
  const order: HealthLevel[] = ["fix", "note", "ok"];
  const sorted = [...checks].sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
  const fixes = checks.filter((c) => c.level === "fix").length;
  const notes = checks.filter((c) => c.level === "note").length;

  return (
    <>
      <PageHeader eyebrow="Keep things right" title="Health check" />
      <div className="relative mx-auto -mt-6 flex max-w-4xl flex-col gap-4 px-5 pb-24 md:px-10">
        <div className="rounded-3xl border bg-card p-5 shadow-soft">
          <p className="font-display text-lg font-semibold">
            {fixes === 0 ? "Nothing needs fixing." : `${fixes} thing${fixes === 1 ? "" : "s"} to fix`}
            {notes > 0 && <span className="text-muted-foreground"> · {notes} note{notes === 1 ? "" : "s"}</span>}
          </p>
          <p className="text-sm text-muted-foreground">Fix items can make your numbers wrong. Notes are worth a look.</p>
        </div>
        <ul className="flex flex-col gap-2">
          {sorted.map((c) => (
            <li key={c.id}>
              <Link to={c.link} className="flex items-center gap-3 rounded-3xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className={`w-14 shrink-0 rounded-full py-1 text-center text-xs font-semibold ${BADGE[c.level]}`}>{LABEL[c.level]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{c.label}</span>
                  <span className="block text-sm text-muted-foreground">{c.detail}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

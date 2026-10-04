import { createFileRoute, Link } from "@tanstack/react-router";
import { PageSkeleton } from "@/components/EmptyState";
import { useState } from "react";
import { AlertTriangle, Info, PiggyBank, TrendingDown, Wallet, Scale, Percent } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { SampleDataCard } from "@/components/SampleDataCard";
import { SetupChecklist } from "@/components/SetupChecklist";
import { usePlan } from "@/lib/use-plan";
import { useHealth } from "@/lib/use-health";
import { CATEGORY_TYPES, monthAlerts, monthSummary } from "@/lib/engine";
import { formatMoney, monthLabel } from "@/lib/format";
import { currencySymbol } from "@/lib/currencies";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Halal Budget Planner" },
      { name: "description", content: "Your month at a glance: income received, spending, savings, goals and alerts." },
      { property: "og:title", content: "Dashboard — Halal Budget Planner" },
      { property: "og:description", content: "Your month at a glance: income received, spending, savings, goals and alerts." },
    ],
  }),
  component: Page,
});

const C = {
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
  slate: "#63899C",
  grid: "hsl(var(--border))",
  text: "hsl(var(--muted-foreground))",
};

function Page() {
  const p = usePlan();
  const health = useHealth();
  const [year, setYear] = useState<0 | 1>(0);

  if (p.loading) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="Dashboard" />
        <PageSkeleton />
      </>
    );
  }
  const { summary: s, currency: cur, plan, k } = p;
  const fm = (n: number) => formatMoney(n, cur);
  const sym = currencySymbol(cur);
  const alerts = monthAlerts(plan, k, s, p.goals);
  if (health) {
    const fixes = health.checks.filter((c) => c.level === "fix").length;
    alerts.unshift(fixes > 0
      ? { level: "fix", message: `Health check: ${fixes} thing${fixes === 1 ? "" : "s"} to fix.` }
      : { level: "note", message: "Health check: nothing needs fixing." });
    if (health.dueSoon > 0) alerts.push({ level: "note", message: `${health.dueSoon} recurring payment${health.dueSoon === 1 ? "" : "s"} due within 7 days.` });
    if (health.interestWaiting > 0.005) alerts.push({ level: "note", message: `${fm(health.interestWaiting)} of interest is waiting to be given away.` });
    for (const g of p.goals.filter((g) => g.saved < -0.005)) alerts.push({ level: "fix", message: `Goal "${g.goal.name}" has more withdrawn than saved (${fm(g.saved)}).` });
  }
  const byType = CATEGORY_TYPES.map((t) => ({ type: t, Planned: round(s.byType[t].planned), Actual: round(s.byType[t].actual) }));
  const trend = Array.from({ length: 12 }, (_, i) => {
    const mk = year * 12 + i;
    const m = monthSummary(plan, mk, p.incomeEntries, p.plannedIncome);
    return {
      month: new Date(`${plan.months[mk]}-01T00:00:00`).toLocaleDateString(undefined, { month: "short" }),
      Income: round(m.received),
      Spending: round(m.spentExSavings),
      Saving: round(m.saved),
    };
  });
  const greet = p.profile.name ? `Assalamu alaikum, ${p.profile.name}` : "Overview";

  return (
    <>
      <PageHeader eyebrow={greet} title={monthLabel(plan.months[k]!)} actions={<MonthSwitcher months={plan.months} k={k} />} />
      <div className="relative mx-auto -mt-6 flex max-w-6xl flex-col gap-5 px-5 md:px-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Card icon={<Wallet className="size-5" />} label="Income received" value={fm(s.received)} />
          <Card icon={<TrendingDown className="size-5" />} label="Spent (excl. savings)" value={fm(s.spentExSavings)} />
          <Card icon={<PiggyBank className="size-5" />} label="Saved" value={fm(s.saved)} />
          <Card icon={<Scale className="size-5" />} label="Left from income" value={fm(s.left)} bad={s.left < 0} />
          <Card
            icon={<Percent className="size-5" />}
            label="Savings rate"
            value={s.savingsRate == null ? "—" : `${Math.round(s.savingsRate * 100)}%`}
            hint={s.received > 0 ? "of income received" : s.plannedIncome > 0 ? "of planned income (none received yet)" : "add income to see this"}
          />
        </div>

        <SampleDataCard />
        <SetupChecklist unallocated={p.plannedIncome - s.plannedOut} incomeEntries={p.incomeEntries.length} goals={p.goals.length} />

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Alerts">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">All clear for this month.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {alerts.map((a, i) => (
                  <li key={i} className={`flex items-start gap-2 rounded-2xl p-3 text-sm ${a.level === "fix" ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
                    {a.level === "fix" ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <Info className="mt-0.5 size-4 shrink-0 text-primary" />}
                    {a.message}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Goals" action={<Link to="/goals" className="text-sm font-medium text-primary">View all</Link>}>
            {p.goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals yet. Save for big purchases with cash goals.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {p.goals.map((g) => (
                  <li key={g.goal.id}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium">{g.goal.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {fm(g.saved)}
                        {g.goal.target != null && ` / ${fm(g.goal.target)}`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(g.progress ?? 0)} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.goal.name} progress`}>
                      <div className="bg-header-gradient h-full rounded-full" style={{ width: `${g.progress ?? 0}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {g.progress == null
                        ? "No target set"
                        : g.remaining === 0
                          ? "Reached — alhamdulillah!"
                          : g.monthsToGo == null
                            ? `${Math.round(g.progress)}% · add a monthly plan to estimate completion`
                            : `${Math.round(g.progress)}% · about ${g.monthsToGo} month${g.monthsToGo === 1 ? "" : "s"} to go (estimate: ${monthLabel(g.estimatedCompletion!)})`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Planned vs actual by type">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="type" tick={{ fill: C.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.text, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v}`} width={64} />
                <Tooltip formatter={(v: number) => fm(v)} contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--muted))" }} />
                <Legend />
                <Bar dataKey="Planned" fill={C.slate} radius={[8, 8, 0, 0]} />
                <Bar dataKey="Actual" fill={C.primary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="12-month trend"
          action={
            <div role="tablist" aria-label="Plan year" className="flex rounded-full bg-muted p-1">
              {(["Year 1", "Year 2"] as const).map((label, i) => (
                <button
                  key={label}
                  role="tab"
                  aria-selected={year === i}
                  onClick={() => setYear(i as 0 | 1)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${year === i ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="month" tick={{ fill: C.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: C.text, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${sym}${v}`} width={64} />
                <Tooltip formatter={(v: number) => fm(v)} contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke={C.primary} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Spending" stroke={C.accent} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="Saving" stroke={C.slate} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </>
  );
}

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 16,
  color: "hsl(var(--card-foreground))",
};
const round = (n: number) => Math.round(n * 100) / 100;

function Card({ icon, label, value, bad, hint }: { icon: React.ReactNode; label: string; value: string; bad?: boolean; hint?: string }) {
  return (
    <div className={`rounded-3xl border bg-card p-4 shadow-soft ${bad ? "border-destructive/50" : ""}`}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-mint text-mint-foreground">{icon}</span>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-display text-xl font-bold tabular-nums ${bad ? "text-destructive" : ""}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

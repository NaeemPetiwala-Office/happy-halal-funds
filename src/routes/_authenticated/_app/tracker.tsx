import { createFileRoute, Link } from "@tanstack/react-router";
import { PageSkeleton } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { StatusBadge } from "@/components/StatusBadge";
import { usePlan } from "@/lib/use-plan";
import { trackerRows } from "@/lib/engine";
import { formatMoney, monthLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_app/tracker")({
  head: () => ({
    meta: [
      { title: "Tracker — Halal Budget Planner" },
      { name: "description", content: "See planned, carry-in, actual and remaining for every category this month." },
      { property: "og:title", content: "Tracker — Halal Budget Planner" },
      { property: "og:description", content: "See planned, carry-in, actual and remaining for every category this month." },
    ],
  }),
  component: Page,
});

function Page() {
  const p = usePlan();
  if (p.loading) {
    return (
      <>
        <PageHeader eyebrow="Track" title="Tracker" />
        <PageSkeleton />
      </>
    );
  }
  const rows = trackerRows(p.plan, p.k);
  const cur = p.currency;
  const fm = (n: number) => formatMoney(n, cur);
  const tot = rows.reduce(
    (a, r) => ({ planned: a.planned + r.planned, carryIn: a.carryIn + r.carryIn, available: a.available + r.available, actual: a.actual + r.actual, remaining: a.remaining + r.remaining, carryOut: a.carryOut + r.carryOut }),
    { planned: 0, carryIn: 0, available: 0, actual: 0, remaining: 0, carryOut: 0 },
  );
  const monthEnded = `${p.plan.months[p.k + 1] ?? "9999-12"}-01` <= p.plan.today;

  return (
    <>
      <PageHeader eyebrow="Track" title="Tracker" actions={<MonthSwitcher months={p.plan.months} k={p.k} />} />
      <div className="relative mx-auto -mt-6 flex max-w-6xl flex-col gap-4 px-5 md:px-10">
        {!p.monthValid && (
          <p className="rounded-3xl border border-destructive/40 bg-card p-4 text-sm text-destructive shadow-soft">
            Your saved month was outside your 24-month plan, so we're showing the closest month instead.
          </p>
        )}
        <section className="rounded-3xl border bg-card p-5 shadow-soft">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg">{monthLabel(p.plan.months[p.k]!)}</h2>
            <p className="text-xs text-muted-foreground">
              {monthEnded ? "Month ended — carry-out moves into next month." : "Carry-out is an estimate until this month ends."}
            </p>
          </div>
          {rows.length === 0 ? (
            <p className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">
              No categories yet. <Link to="/budget" className="font-medium text-primary underline">Add them on the Budget page.</Link>
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    {["Category", "Planned", "Carry-in", "Available", "Actual", "Remaining", "% used", "Status", "Carry-out"].map((h, i) => (
                      <th key={h} className={`px-2 pb-2 font-medium ${i === 0 || i === 7 ? "text-start" : "text-end"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.category.id} className="border-t">
                      <td className="px-2 py-2.5">
                        <p className="font-medium">{r.category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.category.type}
                          {r.auto > 0 && ` · includes ${fm(r.auto)} auto-counted`}
                        </p>
                      </td>
                      <Num v={fm(r.planned)} />
                      <Num v={fm(r.carryIn)} tone={r.carryIn < 0 ? "bad" : undefined} />
                      <Num v={fm(r.available)} />
                      <Num v={fm(r.actual)} />
                      <Num v={fm(r.remaining)} tone={r.remaining < -0.005 ? "bad" : undefined} strong />
                      <td className="px-2 py-2.5 text-end">
                        <div className="ms-auto flex w-24 items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${r.pctUsed > 100 ? "bg-destructive" : r.pctUsed >= 90 ? "bg-accent" : "bg-primary"}`}
                              style={{ width: `${Math.min(Math.max(r.pctUsed, 0), 100)}%` }}
                            />
                          </div>
                          <span className="w-9 text-xs tabular-nums">{Math.round(r.pctUsed)}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5"><StatusBadge status={r.status} /></td>
                      <Num v={r.category.leftover_mode === "drop" ? `${fm(0)} (dropped)` : fm(r.carryOut)} tone={r.carryOut < -0.005 ? "bad" : undefined} />
                    </tr>
                  ))}
                  <tr className="border-t-2 font-semibold">
                    <td className="px-2 py-2.5">Total</td>
                    <Num v={fm(tot.planned)} />
                    <Num v={fm(tot.carryIn)} />
                    <Num v={fm(tot.available)} />
                    <Num v={fm(tot.actual)} />
                    <Num v={fm(tot.remaining)} tone={tot.remaining < -0.005 ? "bad" : undefined} />
                    <td />
                    <td />
                    <Num v={fm(tot.carryOut)} />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Num({ v, tone, strong }: { v: string; tone?: "bad" | undefined; strong?: boolean }) {
  return <td className={`px-2 py-2.5 text-end tabular-nums ${tone === "bad" ? "text-destructive" : ""} ${strong ? "font-semibold" : ""}`}>{v}</td>;
}

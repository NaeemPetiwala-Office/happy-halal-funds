import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import { accountsQuery, categoriesQuery, incomeSourcesQuery, transactionsQuery } from "@/lib/data";
import { setupChecklist } from "@/lib/engine";

/** Shown on the Dashboard until every setup step is done. */
export function SetupChecklist({ unallocated, incomeEntries, goals }: { unallocated: number; incomeEntries: number; goals: number }) {
  const sources = useQuery(incomeSourcesQuery).data;
  const cats = useQuery(categoriesQuery).data;
  const accounts = useQuery(accountsQuery).data;
  const txs = useQuery(transactionsQuery).data;
  if (!sources || !cats || !accounts || !txs) return null;
  const steps = setupChecklist({ incomeSources: sources.length, categories: cats.length, unallocated, accounts: accounts.length, goals, transactions: txs.length, incomeEntries });
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg">Set up your plan</h2>
        <span className="text-sm text-muted-foreground">{done} of {steps.length} done</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted"><div className="bg-header-gradient h-full rounded-full" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.id}>
            <Link to={s.link} className={`flex items-center gap-3 rounded-2xl p-3 text-sm transition-colors hover:bg-secondary ${s.done ? "text-muted-foreground" : "bg-muted font-medium"}`}>
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${s.done ? "border-primary bg-primary text-primary-foreground" : ""}`}>{s.done && <Check className="size-3.5" />}</span>
              <span className={`flex-1 ${s.done ? "line-through" : ""}`}>{s.label}</span>
              {!s.done && <ChevronRight className="size-4 rtl:rotate-180" />}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

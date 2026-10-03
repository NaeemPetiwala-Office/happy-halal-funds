import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/MonthPicker";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { accountsQuery, friendlyError, incomeEntriesQuery, transactionsQuery, transfersQuery } from "@/lib/data";
import { accountTotals } from "@/lib/engine";
import { formatMoney } from "@/lib/format";
import { currentMonthInput, monthInputToDate, profileQuery } from "@/lib/profile";
import { usePlan } from "@/lib/use-plan";

const MODULES = [
  { key: "ramadan", label: "Ramadan planner", hint: "Iftar, Eid and giving for the blessed month." },
  { key: "qurbani", label: "Qurbani planner", hint: "Your share and Eid al-Adha costs." },
  { key: "hajj", label: "Hajj & Umrah planner", hint: "Package, travel and spending money." },
] as const;

export function ModulesCard() {
  const { data: profile } = useQuery(profileQuery);
  const qc = useQueryClient();
  const mods = (profile?.modules ?? {}) as Record<string, boolean>;
  async function toggle(key: string, on: boolean) {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({ modules: { ...mods, [key]: on } }).eq("user_id", profile.user_id);
    if (error) { toast.error(friendlyError(error)); return; }
    await qc.refetchQueries({ queryKey: profileQuery.queryKey, type: "all" });
  }
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <h2 className="text-lg">Modules</h2>
      <p className="mb-4 text-sm text-muted-foreground">Optional planners. When on, they appear under More.</p>
      <ul className="flex flex-col gap-4">
        {MODULES.map((m) => (
          <li key={m.key} className="flex items-center justify-between gap-4">
            <div><Label htmlFor={`mod-${m.key}`} className="text-base">{m.label}</Label><p className="text-xs text-muted-foreground">{m.hint}</p></div>
            <Switch id={`mod-${m.key}`} checked={Boolean(mods[m.key])} onCheckedChange={(v) => toggle(m.key, v)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NewYearCard() {
  const p = usePlan();
  const qc = useQueryClient();
  const accounts = useQuery(accountsQuery).data ?? [];
  const income = useQuery(incomeEntriesQuery).data ?? [];
  const txs = useQuery(transactionsQuery).data ?? [];
  const transfers = useQuery(transfersQuery).data ?? [];
  const [month, setMonth] = useState(currentMonthInput());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (p.loading) return null;
  const cur = p.currency;
  const accTotals = accountTotals(
    accounts.map((a) => ({ ...a, opening_balance: Number(a.opening_balance), minimum_balance: Number(a.minimum_balance), actual_balance: a.actual_balance == null ? null : Number(a.actual_balance) })),
    income, txs, transfers,
  );
  const round = (n: number) => Math.round(n * 100) / 100;

  async function run() {
    setBusy(true);
    const { error } = await supabase.rpc("start_new_year", {
      new_plan_start: monthInputToDate(month),
      goals: p.loading ? [] : p.goals.map((g) => ({ id: g.goal.id, opening_saved: round(g.saved) })),
      accounts: accTotals.map((t) => ({ id: t.account.id, opening_balance: round(t.balance) })),
    });
    setBusy(false);
    setOpen(false);
    if (error) { toast.error(friendlyError(error)); return; }
    await qc.refetchQueries({ type: "all" });
    toast.success("New year started. Bismillah!");
  }

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mint text-mint-foreground"><CalendarClock className="size-5" /></span>
        <div className="flex-1">
          <h2 className="text-lg">Start a new year</h2>
          <p className="text-sm text-muted-foreground">
            Carries today's goal totals and account balances forward as opening amounts, archives your old transactions, income and transfers, and starts a fresh 24-month plan. Categories, goals, accounts and recurring items stay.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-2"><Label htmlFor="ny-month">New plan start</Label><MonthPicker id="ny-month" value={month} onChange={setMonth} /></div>
        <Button variant="outline" onClick={() => setOpen(true)}>Start a new year…</Button>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start a new year?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>This will:</p>
                <ul className="list-disc space-y-1 ps-5">
                  {p.goals.map((g) => <li key={g.goal.id}>Set "{g.goal.name}" opening saved to {formatMoney(g.saved, cur)}</li>)}
                  {accTotals.map((t) => <li key={t.account.id}>Set "{t.account.name}" opening balance to {formatMoney(t.balance, cur)}</li>)}
                  <li>Archive {txs.length} transactions, {income.length} income entries and {transfers.length} transfers</li>
                  <li>Start the plan in {new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</li>
                </ul>
                <p className="font-medium">Archived entries are kept but no longer shown or counted.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); run(); }} disabled={busy}>{busy ? "Working…" : "Yes, start new year"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

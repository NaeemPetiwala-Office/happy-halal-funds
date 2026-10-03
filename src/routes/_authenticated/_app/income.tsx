import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { accountsQuery, friendlyError, incomeEntriesQuery, incomeSourcesQuery, useInvalidateData, type IncomeEntry } from "@/lib/data";
import { profileQuery } from "@/lib/profile";
import { dateLabel, formatMoney, monthLabel, planMonths, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_app/income")({
  head: () => ({
    meta: [
      { title: "Income — Halal Budget Planner" },
      { name: "description", content: "Record the income you actually receive each month." },
      { property: "og:title", content: "Income — Halal Budget Planner" },
      { property: "og:description", content: "Record the income you actually receive each month." },
    ],
  }),
  component: Page,
});

const ALL = "__all";
const NONE = "__none";

function Page() {
  const { data: profile } = useQuery(profileQuery);
  const { data: entries = [] } = useQuery(incomeEntriesQuery);
  const { data: sources = [] } = useQuery(incomeSourcesQuery);
  const { data: accounts = [] } = useQuery(accountsQuery);
  const invalidate = useInvalidateData();
  const cur = profile?.currency ?? "USD";
  const [month, setMonth] = useState(ALL);
  const [editing, setEditing] = useState<IncomeEntry | "new" | null>(null);

  const srcName = useMemo(() => new Map(sources.map((s) => [s.id, s.name])), [sources]);
  const accName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const filtered = entries.filter((e) => month === ALL || e.date.startsWith(month));
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const expected = sources.reduce((s, x) => s + Number(x.monthly_amount), 0);

  async function remove(e: IncomeEntry) {
    if (!confirm("Delete this income entry?")) return;
    const { error } = await supabase.from("income_entries").delete().eq("id", e.id);
    if (error) return toast.error(friendlyError(error));
    toast.success("Income deleted");
    invalidate();
  }

  return (
    <>
      <PageHeader
        eyebrow="Money in"
        title="Income"
        actions={
          <button type="button" className="glass-btn" aria-label="Add income" onClick={() => setEditing("new")}>
            <Plus className="size-5" />
          </button>
        }
      />
      <div className="relative mx-auto -mt-6 flex max-w-5xl flex-col gap-4 px-5 md:px-10">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Received {month === ALL ? "(all time)" : `in ${monthLabel(month)}`}
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{formatMoney(total, cur)}</p>
          </div>
          <div className="rounded-3xl border bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Expected each month</p>
            <p className="mt-1 font-display text-2xl font-bold">{formatMoney(expected, cur)}</p>
            <p className="text-xs text-muted-foreground">Set on the Budget page</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-56 rounded-full bg-card" aria-label="Filter by month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All months</SelectItem>
              {(profile ? planMonths(profile.plan_start) : []).map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="rounded-full" onClick={() => setEditing("new")}>
            <Plus className="size-4" /> Add income
          </Button>
        </div>

        <div className="rounded-3xl border bg-card shadow-soft">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No income recorded {month === ALL ? "yet" : "for this month"}.</p>
          ) : (
            <ul>
              {filtered.map((e) => (
                <li key={e.id} className="flex items-center gap-3 border-t px-5 py-3 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.source_id ? srcName.get(e.source_id) ?? "Unknown source" : "Other income"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {dateLabel(e.date)}
                      {e.account_id && ` · ${accName.get(e.account_id) ?? ""}`}
                      {e.note && ` · ${e.note}`}
                    </p>
                  </div>
                  <span className="font-display font-semibold">{formatMoney(Number(e.amount), cur)}</span>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Edit income" onClick={() => setEditing(e)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full hover:text-destructive" aria-label="Delete income" onClick={() => remove(e)}>
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editing === "new" ? "Add income" : "Edit income"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <IncomeForm
              key={editing === "new" ? "new" : editing.id}
              initial={editing === "new" ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function IncomeForm({ initial, onDone }: { initial?: IncomeEntry; onDone: () => void }) {
  const { data: sources = [] } = useQuery(incomeSourcesQuery);
  const { data: accounts = [] } = useQuery(accountsQuery);
  const invalidate = useInvalidateData();
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [source, setSource] = useState(initial?.source_id ?? sources[0]?.id ?? NONE);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [account, setAccount] = useState(initial?.account_id ?? NONE);
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const n = Number(amount);
    if (!amount || !Number.isFinite(n) || n <= 0) return toast.error("Enter an amount greater than 0.");
    if (!date) return toast.error("Choose a date.");
    setSaving(true);
    const row = {
      date,
      amount: Math.round(n * 100) / 100,
      source_id: source === NONE ? null : source,
      account_id: account === NONE ? null : account,
      note: note.trim() || null,
    };
    const { error } = initial
      ? await supabase.from("income_entries").update(row).eq("id", initial.id)
      : await supabase.from("income_entries").insert(row);
    setSaving(false);
    if (error) return toast.error(friendlyError(error));
    toast.success(initial ? "Income updated" : "Income added");
    invalidate();
    onDone();
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="inc-amount">Amount</Label>
        <Input id="inc-amount" type="number" inputMode="decimal" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
      </div>
      <div className="grid gap-1.5">
        <Label>Source</Label>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Other income</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>Account</Label>
        <Select value={account} onValueChange={setAccount}>
          <SelectTrigger className="rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No account</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="inc-date">Date</Label>
        <Input id="inc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="inc-note">Note</Label>
        <Input id="inc-note" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
      </div>
      <Button className="mt-2 rounded-full" disabled={saving} onClick={save}>
        {initial ? "Save changes" : "Add income"}
      </Button>
    </div>
  );
}

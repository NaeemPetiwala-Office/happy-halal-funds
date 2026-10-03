import { createFileRoute } from "@tanstack/react-router";
import { PageSkeleton } from "@/components/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Disclaimer, Stat } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { accountsQuery, friendlyError, interestGivenQuery, interestReceivedQuery, useInvalidateData } from "@/lib/data";
import { interestTotals } from "@/lib/engine";
import { dateLabel, formatMoney, todayISO } from "@/lib/format";
import { profileQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/_app/interest")({
  head: () => ({
    meta: [
      { title: "Interest tracker — Halal Budget Planner" },
      { name: "description", content: "Track interest you received and gave away, and what's still waiting to be given." },
      { property: "og:title", content: "Interest tracker — Halal Budget Planner" },
      { property: "og:description", content: "Track interest you received and gave away, and what's still waiting to be given." },
    ],
  }),
  component: Page,
});

const selectCls = "h-11 rounded-full border bg-input px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Page() {
  const { data: profile } = useQuery(profileQuery);
  const { data: received = [], isLoading: pageLoading } = useQuery(interestReceivedQuery);
  const { data: given = [] } = useQuery(interestGivenQuery);
  const { data: accounts = [] } = useQuery(accountsQuery);
  const cur = profile?.currency ?? "USD";
  const fm = (n: number) => formatMoney(n, cur);
  const t = interestTotals(received, given);
  const accName = new Map(accounts.map((a) => [a.id, a.name]));

  if (pageLoading) return <><PageHeader eyebrow="Purification" title="Interest tracker" /><PageSkeleton /></>;
  return (
    <>
      <PageHeader eyebrow="Purification" title="Interest tracker" />
      <div className="relative mx-auto -mt-6 flex max-w-6xl flex-col gap-5 px-5 pb-24 md:px-10">
        <Disclaimer />
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Received" value={fm(t.received)} />
          <Stat label="Given away" value={fm(t.given)} />
          <Stat label="Waiting to give" value={fm(t.waiting)} strong />
        </div>
        <p className="rounded-3xl bg-muted p-4 text-sm text-muted-foreground">
          Many scholars advise giving interest to people in need without expecting reward. It is not Sadaqah or Zakat. Please consult a scholar.
        </p>
        <div className="grid gap-5 lg:grid-cols-2">
          <EntryPanel
            kind="received" title="Interest received"
            rows={received.map((r) => ({ id: r.id, date: r.date, who: r.account_id ? accName.get(r.account_id) ?? "" : "", amount: Number(r.amount), note: r.note }))}
            accounts={accounts.map((a) => ({ id: a.id, name: a.name }))} fm={fm}
          />
          <EntryPanel
            kind="given" title="Given away"
            rows={given.map((r) => ({ id: r.id, date: r.date, who: r.recipient ?? "", amount: Number(r.amount), note: r.note }))}
            accounts={[]} fm={fm}
          />
        </div>
      </div>
    </>
  );
}

interface Row { id: string; date: string; who: string; amount: number; note: string | null }

function EntryPanel({ kind, title, rows, accounts, fm }: { kind: "received" | "given"; title: string; rows: Row[]; accounts: { id: string; name: string }[]; fm: (n: number) => string }) {
  const invalidate = useInvalidateData();
  const table = kind === "received" ? "interest_received" : "interest_given";
  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState("");
  const [who, setWho] = useState("");
  const [note, setNote] = useState("");

  async function add() {
    const a = Number(amount);
    if (!date) { toast.error("Pick a date."); return; }
    if (!amount || Number.isNaN(a) || a <= 0) { toast.error("Enter an amount greater than 0."); return; }
    if (who.length > 80 || note.length > 200) { toast.error("Text is too long."); return; }
    const { error } = kind === "received"
      ? await supabase.from("interest_received").insert({ date, amount: a, account_id: who || null, note: note.trim() || null })
      : await supabase.from("interest_given").insert({ date, amount: a, recipient: who.trim() || null, note: note.trim() || null });
    if (error) { toast.error(friendlyError(error)); return; }
    setAmount(""); setWho(""); setNote(""); invalidate();
  }
  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast.error(friendlyError(error)); return; }
    invalidate();
  }

  return (
    <section className="rounded-3xl border bg-card p-5 shadow-soft">
      <h2 className="mb-3 text-lg">{title}</h2>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input aria-label="Amount" type="number" min="0" step="any" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        {kind === "received" ? (
          <select aria-label="Account" className={selectCls} value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">No account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        ) : (
          <Input aria-label="Recipient" placeholder="Recipient (optional)" value={who} onChange={(e) => setWho(e.target.value)} />
        )}
        <Input aria-label="Note" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button className="col-span-2" onClick={add}><Plus /> Add</Button>
      </div>
      <ul className="divide-y">
        {rows.length === 0 && <li className="py-3 text-sm text-muted-foreground">No entries yet.</li>}
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{dateLabel(r.date)}{r.who && ` · ${r.who}`}</p>
              {r.note && <p className="truncate text-xs text-muted-foreground">{r.note}</p>}
            </div>
            <span className="tabular-nums">{fm(r.amount)}</span>
            <Button size="icon" variant="ghost" aria-label="Delete entry" onClick={() => remove(r.id)}><Trash2 /></Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

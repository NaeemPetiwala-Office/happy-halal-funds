import { createFileRoute } from "@tanstack/react-router";
import { PageSkeleton } from "@/components/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Disclaimer, Stat } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { accountsQuery, categoriesQuery, friendlyError, incomeEntriesQuery, transactionsQuery, transfersQuery, useInvalidateData, zakatLinesQuery, zakatSettingsQuery, type ZakatLine } from "@/lib/data";
import { accountTotals, zakatCalc } from "@/lib/engine";
import { dateLabel, formatMoney, todayISO } from "@/lib/format";
import { profileQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/_app/zakat")({
  head: () => ({
    meta: [
      { title: "Zakat — Halal Budget Planner" },
      { name: "description", content: "Estimate Zakat from your assets and the nisab you choose. A budgeting aid, not religious advice." },
      { property: "og:title", content: "Zakat — Halal Budget Planner" },
      { property: "og:description", content: "Estimate Zakat from your assets and the nisab you choose. A budgeting aid, not religious advice." },
    ],
  }),
  component: Page,
});

const selectCls = "h-11 w-full rounded-full border bg-input px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const num = (s: string) => (s.trim() === "" ? null : Number(s));

function Page() {
  const { data: profile } = useQuery(profileQuery);
  const { data: settings, isLoading } = useQuery(zakatSettingsQuery);
  const { data: lines = [] } = useQuery(zakatLinesQuery);
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: txs = [] } = useQuery(transactionsQuery);
  const { data: accounts = [] } = useQuery(accountsQuery);
  const { data: incomeEntries = [] } = useQuery(incomeEntriesQuery);
  const { data: transfers = [] } = useQuery(transfersQuery);
  const bankBalances = accountTotals(
    accounts.map((a) => ({ ...a, opening_balance: Number(a.opening_balance), minimum_balance: Number(a.minimum_balance), actual_balance: a.actual_balance == null ? null : Number(a.actual_balance) })),
    incomeEntries.map((x) => ({ ...x, amount: Number(x.amount) })),
    txs.map((x) => ({ ...x, amount: Number(x.amount) })),
    transfers.map((x) => ({ ...x, amount: Number(x.amount) })),
  ).reduce((s, a) => s + a.balance, 0);
  const invalidate = useInvalidateData();
  const cur = profile?.currency ?? "USD";

  const [f, setF] = useState({ basis: "Silver" as "Silver" | "Gold", gold_grams: "87.48", silver_grams: "612.36", gold_price: "", silver_price: "", rate: "2.5", anniversary_date: "", zakat_category_id: "" });
  useEffect(() => {
    if (!settings) return;
    setF({
      basis: settings.basis, gold_grams: String(settings.gold_grams), silver_grams: String(settings.silver_grams),
      gold_price: settings.gold_price == null ? "" : String(settings.gold_price), silver_price: settings.silver_price == null ? "" : String(settings.silver_price),
      rate: String(Number(settings.rate) * 100), anniversary_date: settings.anniversary_date ?? "", zakat_category_id: settings.zakat_category_id ?? "",
    });
  }, [settings]);

  async function save() {
    const vals = [num(f.gold_grams), num(f.silver_grams), num(f.gold_price), num(f.silver_price), num(f.rate)];
    if (vals.some((v) => v != null && (Number.isNaN(v) || v < 0))) { toast.error("Please enter positive numbers only."); return; }
    const { error } = await supabase.from("zakat_settings").upsert({
      user_id: profile!.user_id, basis: f.basis, gold_grams: num(f.gold_grams) ?? 87.48, silver_grams: num(f.silver_grams) ?? 612.36,
      gold_price: num(f.gold_price), silver_price: num(f.silver_price), rate: (num(f.rate) ?? 2.5) / 100,
      anniversary_date: f.anniversary_date || null, zakat_category_id: f.zakat_category_id || null,
    });
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success("Zakat settings saved");
    invalidate();
  }

  const r = zakatCalc({
    basis: f.basis, gold_grams: num(f.gold_grams) ?? 0, silver_grams: num(f.silver_grams) ?? 0, gold_price: num(f.gold_price), silver_price: num(f.silver_price),
    rate: (num(f.rate) ?? 0) / 100, anniversary_date: f.anniversary_date || null, zakat_category_id: f.zakat_category_id || null,
    lines: lines.map((l) => ({ kind: l.kind, amount: Number(l.amount) })), bankBalances, transactions: txs.map((t) => ({ ...t, amount: Number(t.amount) })), today: todayISO(),
  });
  const fm = (n: number) => formatMoney(n, cur);
  const priceMissing = r.pricePerGram == null || r.pricePerGram <= 0;

  return (
    <>
      <PageHeader eyebrow="Purify your wealth" title="Zakat" />
      <div className="relative mx-auto -mt-6 flex max-w-6xl flex-col gap-5 px-5 pb-24 md:px-10">
        <Disclaimer />
        {isLoading ? <PageSkeleton /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-soft">
              <h2 className="text-lg">Nisab and settings</h2>
              <div className="flex rounded-full bg-muted p-1" role="radiogroup" aria-label="Nisab basis">
                {(["Silver", "Gold"] as const).map((b) => (
                  <button key={b} role="radio" aria-checked={f.basis === b} onClick={() => setF({ ...f, basis: b })} className={`flex-1 rounded-full py-2 text-sm font-semibold ${f.basis === b ? "bg-card shadow-soft" : "text-muted-foreground"}`}>{b}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Gold nisab (grams)" value={f.gold_grams} onChange={(v) => setF({ ...f, gold_grams: v })} />
                <Field label="Silver nisab (grams)" value={f.silver_grams} onChange={(v) => setF({ ...f, silver_grams: v })} />
                <Field label="Gold price per gram" value={f.gold_price} placeholder="Enter today's price" onChange={(v) => setF({ ...f, gold_price: v })} />
                <Field label="Silver price per gram" value={f.silver_price} placeholder="Enter today's price" onChange={(v) => setF({ ...f, silver_price: v })} />
                <Field label="Rate (%)" value={f.rate} onChange={(v) => setF({ ...f, rate: v })} />
                <div className="space-y-1.5"><Label htmlFor="ann">Zakat anniversary</Label><Input id="ann" type="date" value={f.anniversary_date} onChange={(e) => setF({ ...f, anniversary_date: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zcat">Zakat category (for "already set aside")</Label>
                <select id="zcat" className={selectCls} value={f.zakat_category_id} onChange={(e) => setF({ ...f, zakat_category_id: e.target.value })}>
                  <option value="">None</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">Metal prices change daily. Enter the price you see today; we never fill them in for you.</p>
              <Button onClick={save}>Save settings</Button>
            </section>

            <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-soft">
              <h2 className="text-lg">Results</h2>
              {priceMissing && <p className="rounded-2xl bg-accent/15 p-3 text-sm">Enter the {f.basis.toLowerCase()} price per gram to calculate the nisab.</p>}
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Nisab" value={fm(r.nisab)} hint={priceMissing ? "Needs a price" : `${f.basis === "Gold" ? f.gold_grams : f.silver_grams} g × ${fm(r.pricePerGram!)}`} />
                <Stat label="Net zakatable wealth" value={fm(r.net)} hint={`${fm(r.assets)} assets (incl. ${fm(r.bankBalances)} bank balances) − ${fm(r.liabilities)} liabilities`} />
                <Stat label="Zakat due" value={fm(r.due)} strong hint={r.meetsNisab ? `${f.rate}% of net wealth` : "Below nisab — none due"} />
                <Stat label="Already set aside" value={fm(r.setAside)} hint={f.anniversary_date ? `12 months to ${dateLabel(f.anniversary_date)} · ${r.daysToAnniversary} days away` : "Set an anniversary"} />
                <Stat label="Still to set aside" value={fm(r.stillToSetAside)} strong />
                <Stat label="Suggested per month" value={r.monthlySuggestion == null ? "—" : fm(r.monthlySuggestion)} hint={r.monthsToAnniversary == null ? "Set an anniversary" : `over ${r.monthsToAnniversary} month${r.monthsToAnniversary === 1 ? "" : "s"}`} />
              </div>
              <p className="text-xs text-muted-foreground">Results update as you type and are estimates.</p>
            </section>
          </div>
        )}
        <div className="grid gap-5 lg:grid-cols-2">
          <LinesPanel kind="asset" title="Assets" hint={`Your account balances (${formatMoney(bankBalances, cur)}) are counted automatically. Add cash at home, gold, silver, trade goods, money owed to you.`} lines={lines} cur={cur} />
          <LinesPanel kind="liability" title="Liabilities" hint="Debts due now that you will pay." lines={lines} cur={cur} />
        </div>
      </div>
    </>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = label.replace(/\W+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} inputMode="decimal" type="number" step="any" min="0" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function LinesPanel({ kind, title, hint, lines, cur }: { kind: "asset" | "liability"; title: string; hint: string; lines: ZakatLine[]; cur: string }) {
  const invalidate = useInvalidateData();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const mine = lines.filter((l) => l.kind === kind);
  async function add() {
    const a = Number(amount);
    if (!label.trim() || label.length > 60) { toast.error("Enter a label (up to 60 characters)."); return; }
    if (!amount || Number.isNaN(a) || a < 0) { toast.error("Enter an amount of 0 or more."); return; }
    const { error } = await supabase.from("zakat_lines").insert({ kind, label: label.trim(), amount: a });
    if (error) { toast.error(friendlyError(error)); return; }
    setLabel(""); setAmount(""); invalidate();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("zakat_lines").delete().eq("id", id);
    if (error) { toast.error(friendlyError(error)); return; }
    invalidate();
  }
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-soft">
      <h2 className="text-lg">{title}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{hint}</p>
      <ul className="mb-3 divide-y">
        {mine.length === 0 && <li className="py-3 text-sm text-muted-foreground">Nothing added yet.</li>}
        {mine.map((l) => (
          <li key={l.id} className="flex items-center gap-2 py-2 text-sm">
            <span className="flex-1">{l.label}</span>
            <span className="tabular-nums">{formatMoney(Number(l.amount), cur)}</span>
            <Button size="icon" variant="ghost" aria-label={`Delete ${l.label}`} onClick={() => remove(l.id)}><Trash2 /></Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input aria-label={`${title} label`} placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input aria-label={`${title} amount`} placeholder="Amount" type="number" min="0" step="any" className="w-32" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button size="icon" aria-label={`Add ${kind}`} onClick={add}><Plus /></Button>
      </div>
    </section>
  );
}

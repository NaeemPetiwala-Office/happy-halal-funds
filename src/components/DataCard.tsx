import { useMemo, useState, type ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { accountsQuery, categoriesQuery, friendlyError, transactionsQuery, useInvalidateData } from "@/lib/data";
import { buildImportPreview, guessMapping, parseCSV, toCSV, type ImportField, type Mapping, type PreviewRow } from "@/lib/csv";
import { monthIndex, PLAN_MONTHS } from "@/lib/engine";
import { usePlan } from "@/lib/use-plan";
import { translate as t } from "@/lib/i18n";

const MAX_TX = 1500;
const FIELDS: ImportField[] = ["date", "category", "amount", "account", "note"];
const FIELD_LABEL: Record<ImportField, string> = { date: "Date", category: "Category", amount: "Amount", account: "Account", note: "Note" };
const SKIP = "__skip";

function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function DataCard() {
  const plan = usePlan();
  const { data: txs = [] } = useQuery(transactionsQuery);
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: accs = [] } = useQuery(accountsQuery);
  const [open, setOpen] = useState(false);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const accName = new Map(accs.map((a) => [a.id, a.name]));

  function exportTx() {
    download("transactions.csv", toCSV(["Date", "Category", "Amount", "Account", "Note"],
      txs.map((x) => [x.date, x.category_id ? catName.get(x.category_id) ?? "" : "", x.amount, x.account_id ? accName.get(x.account_id) ?? "" : "", x.note ?? ""])));
  }
  function exportGoals() {
    if (plan.loading) return;
    download("goals.csv", toCSV(["Name", "Priority", "Target", "Opening saved", "Saved from log", "Auto-counted", "Total saved", "Remaining", "Progress %", "Monthly plan", "Months to go"],
      plan.goals.map((g) => [g.goal.name, (g.goal as { priority?: string }).priority ?? "", g.goal.target ?? "", g.goal.opening_saved, g.fromLog, g.auto, g.saved, g.remaining, Math.round(g.progress), g.monthlyPlan, g.monthsToGo ?? ""])));
  }

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-soft">
      <h2 className="text-lg">{t("Data")}</h2>
      <p className="text-sm text-muted-foreground">{t("Download or bring in your data as CSV files.")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportTx} disabled={!txs.length}><Download /> {t("Export transactions")}</Button>
        <Button variant="outline" onClick={exportGoals} disabled={plan.loading || !plan.goals.length}><Download /> {t("Export goals")}</Button>
        <Button onClick={() => setOpen(true)}><Upload /> {t("Import transactions")}</Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Import transactions")}</DialogTitle>
            <DialogDescription>Dates as YYYY-MM-DD. Category and account names must match exactly.</DialogDescription>
          </DialogHeader>
          {open && !plan.loading && (
            <ImportWizard
              planStart={plan.profile.plan_start}
              categories={cats}
              accounts={accs}
              room={MAX_TX - txs.length}
              onDone={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ImportWizard({ planStart, categories, accounts, room, onDone }: {
  planStart: string; categories: { id: string; name: string }[]; accounts: { id: string; name: string }[]; room: number; onDone: () => void;
}) {
  const invalidate = useInvalidateData();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [remap, setRemap] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_000_000) { toast.error("That file is too big (2 MB max)."); return; }
    const data = parseCSV(await f.text());
    if (data.length < 2) { toast.error("The file needs a header row and at least one row."); return; }
    setRows(data); setMapping(guessMapping(data[0]!)); setStep(2);
  }

  const headers = rows[0] ?? [];
  const inWindow = (d: string) => { const k = monthIndex(planStart, d); return k >= 0 && k < PLAN_MONTHS; };
  const preview: PreviewRow[] = useMemo(() => {
    if (step !== 3) return [];
    return buildImportPreview(rows.slice(1), mapping, categories, accounts, inWindow).map((r) => {
      const to = r.status === "unknown-category" ? remap[r.categoryName] : undefined;
      if (to && to !== SKIP) return { ...r, status: "ok", problem: null, category_id: to };
      return r;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, rows, mapping, remap, categories, accounts]);
  const unknown = [...new Set(buildImportPreview(rows.slice(1), mapping, categories, accounts, inWindow).filter((r) => r.status === "unknown-category").map((r) => r.categoryName))];
  const valid = preview.filter((r) => r.status === "ok");

  async function runImport() {
    if (valid.length > room) { toast.error(`Only ${room} more transactions fit (limit ${MAX_TX}).`); return; }
    setBusy(true);
    const { error } = await supabase.from("transactions").insert(valid.map((r) => ({ date: r.date, category_id: r.category_id, amount: r.amount!, account_id: r.account_id, note: r.note })));
    setBusy(false);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success(`${valid.length} transactions imported`);
    invalidate(); onDone();
  }

  const sel = "h-10 w-full rounded-full border bg-input px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="space-y-4">
      <ol className="flex gap-2 text-xs font-semibold" aria-label="Steps">
        {["Choose a CSV file", "Match columns", "Preview"].map((s, i) => (
          <li key={s} aria-current={step === i + 1 ? "step" : undefined} className={`rounded-full px-3 py-1 ${step === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}. {t(s)}</li>
        ))}
      </ol>

      {step === 1 && (
        <div className="space-y-2">
          <Label htmlFor="csv-file">{t("Choose a CSV file")}</Label>
          <input id="csv-file" type="file" accept=".csv,text/csv" onChange={onFile} className="block w-full rounded-full border bg-input px-4 py-2 text-sm file:me-3 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1" />
        </div>
      )}

      {step === 2 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f} className="space-y-1">
                <Label htmlFor={`map-${f}`}>{t(FIELD_LABEL[f])}{f === "date" || f === "category" || f === "amount" ? " *" : ""}</Label>
                <select id={`map-${f}`} className={sel} value={mapping[f] ?? ""} onChange={(e) => setMapping((m) => { const n = { ...m }; if (e.target.value === "") delete n[f]; else n[f] = Number(e.target.value); return n; })}>
                  <option value="">{t("Not in file")}</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>{t("Back")}</Button>
            <Button disabled={mapping.date === undefined || mapping.category === undefined || mapping.amount === undefined} onClick={() => setStep(3)}>{t("Next")}</Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          {unknown.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-destructive/40 p-4">
              <p className="text-sm font-semibold">{unknown.length} unknown {unknown.length === 1 ? "category" : "categories"} — map each to an existing category or skip those rows.</p>
              {unknown.map((u) => (
                <div key={u} className="grid items-center gap-2 sm:grid-cols-2">
                  <Label htmlFor={`remap-${u}`} className="break-all">"{u || "(empty)"}"</Label>
                  <select id={`remap-${u}`} className={sel} value={remap[u] ?? SKIP} onChange={(e) => setRemap((r) => ({ ...r, [u]: e.target.value }))}>
                    <option value={SKIP}>{t("Skip")}</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
          <div className="max-h-72 overflow-auto rounded-2xl border">
            <table className="w-full text-sm">
              <caption className="sr-only">Import preview</caption>
              <thead className="bg-muted text-start text-xs text-muted-foreground"><tr>{["#", "Date", "Category", "Amount", "Status"].map((h) => <th key={h} scope="col" className="px-3 py-2 text-start">{t(h)}</th>)}</tr></thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.line} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{r.line}</td>
                    <td className="px-3 py-2">{r.date}</td>
                    <td className="px-3 py-2 break-all">{r.categoryName}</td>
                    <td className="px-3 py-2">{r.amount ?? "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === "ok" ? "bg-secondary text-secondary-foreground" : "bg-destructive text-destructive-foreground"}`}>
                        {r.status === "ok" ? t("OK") : r.status === "invalid" ? t("Invalid") : t("Unknown category")}
                      </span>
                      {r.problem && <span className="ms-2 text-xs text-muted-foreground">{r.problem}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">{valid.length} of {preview.length} rows will be imported. {room} more transactions fit.</p>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>{t("Back")}</Button>
            <Button disabled={busy || valid.length === 0} onClick={runImport}>{busy ? t("Saving…") : `Import ${valid.length}`}</Button>
          </div>
        </>
      )}
    </div>
  );
}

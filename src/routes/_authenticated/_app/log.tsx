import { createFileRoute } from "@tanstack/react-router";
import { PageSkeleton } from "@/components/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { TransactionForm } from "@/components/TransactionForm";
import { SampleDataCard } from "@/components/SampleDataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { accountsQuery, categoriesQuery, friendlyError, transactionsQuery, useInvalidateData, type Transaction } from "@/lib/data";
import { profileQuery } from "@/lib/profile";
import { dateLabel, formatMoney, monthLabel, planMonths } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/_app/log")({
  head: () => ({
    meta: [
      { title: "Transaction log — Halal Budget Planner" },
      { name: "description", content: "Search, filter, edit and delete every transaction you've logged." },
      { property: "og:title", content: "Transaction log — Halal Budget Planner" },
      { property: "og:description", content: "Search, filter, edit and delete every transaction you've logged." },
    ],
  }),
  component: Page,
});

const ALL = "__all";

function Page() {
  const { data: profile } = useQuery(profileQuery);
  const { data: txs = [], isLoading } = useQuery(transactionsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: accounts = [] } = useQuery(accountsQuery);
  const invalidate = useInvalidateData();
  const cur = profile?.currency ?? "USD";

  const [q, setQ] = useState("");
  const [month, setMonth] = useState(ALL);
  const [cat, setCat] = useState(ALL);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const catName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const accName = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts]);
  const months = profile ? planMonths(profile.plan_start) : [];

  const filtered = txs.filter((t) => {
    if (month !== ALL && !t.date.startsWith(month)) return false;
    if (cat !== ALL && t.category_id !== cat) return false;
    if (q) {
      const hay = `${t.note ?? ""} ${catName.get(t.category_id ?? "") ?? ""} ${accName.get(t.account_id ?? "") ?? ""} ${t.amount}`;
      if (!hay.toLowerCase().includes(q.toLowerCase())) return false;
    }
    return true;
  });
  const total = filtered.reduce((s, t) => s + Number(t.amount), 0);

  async function remove(t: Transaction): Promise<unknown> {
    if (!confirm("Delete this transaction?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", t.id);
    if (error) return toast.error(friendlyError(error));
    toast.success("Transaction deleted");
    invalidate();
    return undefined;
  }

  return (
    <>
      <PageHeader eyebrow="Track" title="Log" />
      <div className="relative mx-auto -mt-6 flex max-w-5xl flex-col gap-4 px-5 md:px-10">
        <div className="grid gap-3 rounded-3xl border bg-card p-4 shadow-soft sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes, categories, accounts" className="ps-10" aria-label="Search transactions" />
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="rounded-full sm:w-48" aria-label="Filter by month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All months</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="rounded-full sm:w-48" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SampleDataCard />

        <div className="rounded-3xl border bg-card shadow-soft">
          <div className="flex items-center justify-between border-b px-5 py-3 text-sm">
            <span className="text-muted-foreground">{filtered.length} transactions</span>
            <span className="font-display font-semibold">Total {formatMoney(total, cur)}</span>
          </div>
          {isLoading ? (
            <PageSkeleton />
          ) : filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {txs.length ? "No transactions match these filters." : "No transactions yet. Tap + to add your first."}
            </p>
          ) : (
            <ul>
              {filtered.map((t) => (
                <li key={t.id} className="flex items-center gap-3 border-t px-5 py-3 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {t.category_id ? catName.get(t.category_id) ?? "Unknown category" : <span className="text-destructive">No category</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {dateLabel(t.date)}
                      {t.account_id && ` · ${accName.get(t.account_id) ?? ""}`}
                      {t.note && ` · ${t.note}`}
                    </p>
                  </div>
                  <span className={`font-display font-semibold ${Number(t.amount) < 0 ? "text-primary" : ""}`}>
                    {formatMoney(Number(t.amount), cur)}
                  </span>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Edit transaction" onClick={() => setEditing(t)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full hover:text-destructive" aria-label="Delete transaction" onClick={() => remove(t)}>
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">Edit transaction</DialogTitle>
          </DialogHeader>
          {editing && <TransactionForm key={editing.id} initial={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

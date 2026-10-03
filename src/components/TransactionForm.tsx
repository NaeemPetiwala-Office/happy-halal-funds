import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Delete } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accountsQuery, categoriesQuery, friendlyError, useInvalidateData, type Transaction } from "@/lib/data";
import { profileQuery } from "@/lib/profile";
import { currencySymbol } from "@/lib/currencies";
import { todayISO } from "@/lib/format";

const NONE = "__none";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "±", "0", "."];

export function TransactionForm({
  initial,
  onDone,
  allowAnother = true,
}: {
  initial?: Transaction;
  onDone?: () => void;
  allowAnother?: boolean;
}) {
  const { data: profile } = useQuery(profileQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: accounts = [] } = useQuery(accountsQuery);
  const invalidate = useInvalidateData();

  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [accountId, setAccountId] = useState(initial?.account_id ?? NONE);
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);

  const press = (k: string) => {
    setAmount((a) => {
      if (k === "±") return a.startsWith("-") ? a.slice(1) : `-${a}`;
      if (k === ".") return a.includes(".") ? a : `${a || "0"}.`;
      const dec = a.split(".")[1];
      if (dec && dec.length >= 2) return a;
      if (a.replace("-", "").replace(".", "").length >= 10) return a;
      if (a === "0") return k;
      if (a === "-0") return `-${k}`;
      return a + k;
    });
  };

  async function save(another: boolean): Promise<unknown> {
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value === 0) return toast.error("Enter an amount (not zero).");
    if (!categoryId) return toast.error("Choose a category.");
    if (!date) return toast.error("Choose a date.");
    if (note.length > 200) return toast.error("Note must be 200 characters or fewer.");
    setSaving(true);
    const row = {
      amount: Math.round(value * 100) / 100,
      category_id: categoryId,
      account_id: accountId === NONE ? null : accountId,
      date,
      note: note.trim() || null,
    };
    const { error } = initial
      ? await supabase.from("transactions").update(row).eq("id", initial.id)
      : await supabase.from("transactions").insert(row);
    setSaving(false);
    if (error) return toast.error(friendlyError(error));
    toast.success(initial ? "Transaction updated" : "Transaction saved");
    invalidate();
    if (another) {
      setAmount("");
      setNote("");
    } else onDone?.();
    return undefined;
  }

  const symbol = currencySymbol(profile?.currency ?? "USD");
  const negative = amount.startsWith("-");

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center" aria-live="polite">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {negative ? "Refund / withdrawal" : "Amount"}
        </p>
        <p className={`mt-1 font-display text-4xl font-bold ${negative ? "text-primary" : ""}`}>
          {negative ? "-" : ""}
          {symbol}
          {amount.replace("-", "") || "0"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Number keypad">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            aria-label={k === "±" ? "Toggle negative" : k}
            className="h-12 rounded-full bg-muted font-display text-xl font-semibold transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAmount((a) => a.slice(0, -1))}
          aria-label="Delete last digit"
          className="col-span-3 flex h-10 items-center justify-center gap-2 rounded-full bg-muted text-sm text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Delete className="size-4" /> Delete
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="rounded-full">
              <SelectValue placeholder={categories.length ? "Choose…" : "Add categories on Budget first"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Account</Label>
          <Select value={accountId} onValueChange={setAccountId}>
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
          <Label htmlFor="tx-date">Date</Label>
          <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tx-note">Note</Label>
          <Input id="tx-note" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button className="flex-1 rounded-full" disabled={saving} onClick={() => save(false)}>
          {initial ? "Save changes" : "Save"}
        </Button>
        {allowAnother && !initial && (
          <Button variant="secondary" className="flex-1 rounded-full" disabled={saving} onClick={() => save(true)}>
            Save and add another
          </Button>
        )}
      </div>
    </div>
  );
}

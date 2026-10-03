import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Stat } from "@/components/Disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, modulePlansQuery, useInvalidateData } from "@/lib/data";
import { plannerTotals, type PlannerData, type PlannerItem } from "@/lib/engine";
import { formatMoney, todayISO } from "@/lib/format";
import { profileQuery } from "@/lib/profile";
import type { Json } from "@/integrations/supabase/types";

export type ModuleKey = "ramadan" | "qurbani" | "hajj";

export function PlannerPage({ module, title, eyebrow, icon, suggestions, footer }: {
  module: ModuleKey; title: string; eyebrow: string; icon: ReactNode; suggestions: string[]; footer?: ReactNode;
}) {
  const { data: profile } = useQuery(profileQuery);
  const { data: plans = [], isLoading } = useQuery(modulePlansQuery);
  const invalidate = useInvalidateData();
  const enabled = Boolean((profile?.modules as Record<string, boolean> | null)?.[module]);
  const row = plans.find((p) => p.module === module);
  const [data, setData] = useState<PlannerData>({ start_date: "", end_date: "", items: [] });
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (row && !dirty) setData(row.data as PlannerData); }, [row, dirty]);
  const cur = profile?.currency ?? "USD";
  const fm = (n: number) => formatMoney(n, cur);

  if (!enabled) {
    return (
      <>
        <PageHeader eyebrow={eyebrow} title={title} />
        <div className="relative mx-auto -mt-6 max-w-3xl px-5">
          <div className="rounded-3xl border bg-card p-8 text-center shadow-soft">
            <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-mint text-mint-foreground">{icon}</span>
            <p className="mb-4 text-muted-foreground">This planner is switched off.</p>
            <Button asChild><Link to="/settings">Turn it on in Settings</Link></Button>
          </div>
        </div>
      </>
    );
  }

  const items = data.items ?? [];
  const t = plannerTotals(data, todayISO());
  const update = (d: PlannerData) => { setData(d); setDirty(true); };
  const setItem = (id: string, patch: Partial<PlannerItem>) => update({ ...data, items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  async function save() {
    if (items.some((i) => !i.name.trim() || i.name.length > 60)) { toast.error("Every item needs a name (up to 60 characters)."); return; }
    if (items.some((i) => !(i.planned >= 0) || !(i.spent >= 0))) { toast.error("Amounts must be 0 or more."); return; }
    if (items.length > 50) { toast.error("Up to 50 items."); return; }
    if (data.start_date && data.end_date && data.end_date < data.start_date) { toast.error("The end date is before the start date."); return; }
    const clean = { start_date: data.start_date || null, end_date: data.end_date || null, items: items.map((i) => ({ ...i, name: i.name.trim() })) };
    const { error } = await supabase.from("module_plans").upsert({ module, data: clean as unknown as Json, updated_at: new Date().toISOString() }, { onConflict: "user_id,module" });
    if (error) { toast.error(friendlyError(error)); return; }
    setDirty(false); toast.success("Saved"); invalidate();
  }

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} actions={<Button variant="secondary" size="sm" onClick={save} disabled={!dirty}>Save</Button>} />
      <div className="relative mx-auto -mt-6 flex max-w-5xl flex-col gap-5 px-5 pb-24 md:px-10">
        {isLoading ? <p className="text-center text-muted-foreground">Loading…</p> : <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Planned" value={fm(t.planned)} />
            <Stat label="Spent" value={fm(t.spent)} />
            <Stat label="Months until" value={t.monthsUntil == null ? "—" : String(t.monthsUntil)} hint={t.monthsUntil == null ? "Add a start date" : undefined} />
            <Stat label="Set aside per month" value={t.monthlySetAside == null ? "—" : fm(t.monthlySetAside)} strong hint={`for ${fm(t.remaining)} still needed`} />
          </div>
          <section className="rounded-3xl border bg-card p-5 shadow-soft">
            <h2 className="mb-3 text-lg">Dates</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="sd">Starts</Label><Input id="sd" type="date" value={data.start_date ?? ""} onChange={(e) => update({ ...data, start_date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="ed">Ends (optional)</Label><Input id="ed" type="date" value={data.end_date ?? ""} onChange={(e) => update({ ...data, end_date: e.target.value })} /></div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Islamic dates depend on moon sighting, so enter the expected date yourself.</p>
          </section>
          <section className="rounded-3xl border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-lg">Items</h2>
              <Button size="sm" onClick={() => update({ ...data, items: [...items, { id: crypto.randomUUID(), name: "", planned: 0, spent: 0 }] })}><Plus /> Add item</Button>
            </div>
            {items.length === 0 && (
              <div className="flex flex-wrap gap-2">
                <p className="w-full text-sm text-muted-foreground">Start with a suggestion:</p>
                {suggestions.map((s) => <Button key={s} variant="outline" size="sm" onClick={() => update({ ...data, items: [...items, { id: crypto.randomUUID(), name: s, planned: 0, spent: 0 }] })}>{s}</Button>)}
              </div>
            )}
            <ul className="flex flex-col gap-2">
              {items.map((i) => (
                <li key={i.id} className="grid grid-cols-[1fr_6rem_6rem_auto] items-center gap-2">
                  <Input aria-label="Item name" placeholder="Item" value={i.name} onChange={(e) => setItem(i.id, { name: e.target.value })} />
                  <Input aria-label={`${i.name} planned`} type="number" min="0" step="any" value={i.planned} onChange={(e) => setItem(i.id, { planned: Number(e.target.value) })} />
                  <Input aria-label={`${i.name} spent`} type="number" min="0" step="any" value={i.spent} onChange={(e) => setItem(i.id, { spent: Number(e.target.value) })} />
                  <Button size="icon" variant="ghost" aria-label={`Remove ${i.name}`} onClick={() => update({ ...data, items: items.filter((x) => x.id !== i.id) })}><Trash2 /></Button>
                </li>
              ))}
            </ul>
            {items.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Columns: item · planned · spent. Remember to save.</p>}
          </section>
          {footer}
        </>}
      </div>
    </>
  );
}

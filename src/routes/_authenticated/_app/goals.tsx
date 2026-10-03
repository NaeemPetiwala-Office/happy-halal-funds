import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, goalsQuery, useInvalidateData, type Goal } from "@/lib/data";
import { formatMoney, monthLabel } from "@/lib/format";
import { usePlan } from "@/lib/use-plan";

export const Route = createFileRoute("/_authenticated/_app/goals")({
  head: () => ({ meta: [
    { title: "Goals — Halal Budget Planner" },
    { name: "description", content: "Cash goals with progress, monthly plans and estimated completion." },
    { property: "og:title", content: "Goals — Halal Budget Planner" },
    { property: "og:description", content: "Cash goals with progress, monthly plans and estimated completion." },
  ] }),
  component: GoalsPage,
});

const priorities = ["High", "Medium", "Low"] as const;

function GoalsPage() {
  const { data: rawGoals = [] } = useQuery(goalsQuery);
  const plan = usePlan();
  const invalidate = useInvalidateData();
  const [editing, setEditing] = useState<Goal | "new" | null>(null);
  if (plan.loading) return <><PageHeader eyebrow="Saving up" title="Goals" /><p className="p-8 text-center text-muted-foreground">Loading goals…</p></>;
  const currency = plan.currency;

  async function remove(goal: Goal) {
    if (!confirm(`Delete goal "${goal.name}"? Linked categories will keep their budgets but lose this goal.`)) return;
    const { error } = await supabase.from("goals").delete().eq("id", goal.id);
    if (error) { toast.error(friendlyError(error)); return; }
    invalidate(); toast.success("Goal deleted");
  }

  return <>
    <PageHeader eyebrow="Saving up" title="Goals" actions={<Button variant="secondary" size="sm" onClick={() => setEditing("new")} disabled={rawGoals.length >= 10}><Plus /> Add goal</Button>} />
    <main className="relative mx-auto -mt-6 flex max-w-6xl flex-col gap-5 px-5 pb-24 md:px-10">
      {plan.goals.length === 0 ? <Empty text="Add a cash goal, then link a Savings category to it on the Budget page." /> : <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plan.goals.map((total) => {
            const status = total.remaining === 0 ? "Reached" : total.monthlyPlan <= 0 ? "Needs a monthly plan" : total.goal.target == null ? "Needs a target" : "In progress";
            const raw = rawGoals.find((goal) => goal.id === total.goal.id);
            return <article key={total.goal.id} className="rounded-3xl border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-muted-foreground">{raw?.priority} priority</p><h2 className="mt-1 text-xl">{total.goal.name}</h2></div><div className="flex"><Button size="icon" variant="ghost" aria-label={`Edit ${total.goal.name}`} onClick={() => raw && setEditing(raw)}><Pencil /></Button><Button size="icon" variant="ghost" className="hover:text-destructive" aria-label={`Delete ${total.goal.name}`} onClick={() => raw && remove(raw)}><Trash2 /></Button></div></div>
              <div className="mt-5 flex items-end justify-between"><div><p className="text-2xl font-bold">{formatMoney(total.saved, currency)}</p><p className="text-xs text-muted-foreground">of {total.goal.target == null ? "no target" : formatMoney(total.goal.target, currency)}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">{status}</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${total.progress ?? 0}%` }} /></div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm"><Metric label="Opening saved" value={formatMoney(total.goal.opening_saved, currency)} /><Metric label="Saved from log" value={formatMoney(total.savedFromLog, currency)} /><Metric label="Auto-counted" value={formatMoney(total.autoCounted, currency)} /><Metric label="Remaining" value={total.remaining == null ? "—" : formatMoney(total.remaining, currency)} /><Metric label="Monthly plan" value={formatMoney(total.monthlyPlan, currency)} /><Metric label="Months to go" value={total.monthsToGo == null ? "—" : String(total.monthsToGo)} /></div>
              <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">Estimated completion: {total.estimatedCompletion ? monthLabel(total.estimatedCompletion) : "Not available"}</p>
            </article>;
          })}
        </div>
        <section className="overflow-x-auto rounded-3xl border bg-card p-5 shadow-soft"><h2 className="mb-4 text-lg">Goal comparison</h2><table className="w-full min-w-[900px] text-sm"><thead className="text-muted-foreground"><tr><Th>Goal</Th><Th>Target</Th><Th>Total</Th><Th>Remaining</Th><Th>Progress</Th><Th>Monthly plan</Th><Th>Months to go</Th><Th>Auto-count</Th><Th>Status</Th></tr></thead><tbody>{plan.goals.map((g) => <tr key={g.goal.id} className="border-t"><Td>{g.goal.name}</Td><Td>{g.goal.target == null ? "—" : formatMoney(g.goal.target, currency)}</Td><Td>{formatMoney(g.saved, currency)}</Td><Td>{g.remaining == null ? "—" : formatMoney(g.remaining, currency)}</Td><Td>{g.progress == null ? "—" : `${Math.round(g.progress)}%`}</Td><Td>{formatMoney(g.monthlyPlan, currency)}</Td><Td>{g.monthsToGo ?? "—"}</Td><Td>{g.goal.auto_count ? "On" : "Off"}</Td><Td>{g.remaining === 0 ? "Reached" : "In progress"}</Td></tr>)}</tbody></table></section>
      </>}
    </main>
    <Dialog open={editing != null} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>{editing === "new" ? "Add goal" : "Edit goal"}</DialogTitle></DialogHeader>{editing && <GoalForm initial={editing === "new" ? undefined : editing} goals={rawGoals} onDone={() => setEditing(null)} />}</DialogContent></Dialog>
  </>;
}

function GoalForm({ initial, goals, onDone }: { initial: Goal | undefined; goals: Goal[]; onDone: () => void }) {
  const invalidate = useInvalidateData();
  const [name, setName] = useState(initial?.name ?? ""); const [target, setTarget] = useState(initial?.target == null ? "" : String(initial.target)); const [opening, setOpening] = useState(String(initial?.opening_saved ?? 0)); const [priority, setPriority] = useState<Goal["priority"]>(initial?.priority ?? "Medium"); const [auto, setAuto] = useState(initial?.auto_count ?? false); const [saving, setSaving] = useState(false);
  async function save() {
    const clean = name.trim(); const targetNumber = target === "" ? null : Number(target); const openingNumber = Number(opening);
    if (!clean) { toast.error("Enter a goal name."); return; }
    if (goals.some((g) => g.id !== initial?.id && g.name === clean)) { toast.error("That goal name is already used."); return; }
    if ((targetNumber != null && (!Number.isFinite(targetNumber) || targetNumber < 0)) || !Number.isFinite(openingNumber)) { toast.error("Check the target and opening amount."); return; }
    setSaving(true); const row = { name: clean, target: targetNumber, opening_saved: openingNumber, priority, auto_count: auto }; const { error } = initial ? await supabase.from("goals").update(row).eq("id", initial.id) : await supabase.from("goals").insert(row); setSaving(false);
    if (error) { toast.error(friendlyError(error)); return; } invalidate(); toast.success(initial ? "Goal updated" : "Goal added"); onDone();
  }
  return <div className="grid gap-4"><Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus /></Field><div className="grid grid-cols-2 gap-3"><Field label="Target"><Input type="number" inputMode="decimal" min="0" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Optional" /></Field><Field label="Opening saved"><Input type="number" inputMode="decimal" step="0.01" value={opening} onChange={(e) => setOpening(e.target.value)} /></Field></div><Field label="Priority"><Select value={priority} onValueChange={(v) => setPriority(v as Goal["priority"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></Field><div className="flex items-center justify-between rounded-2xl bg-muted p-4"><div><Label htmlFor="auto-count">Auto-count completed months</Label><p className="text-xs text-muted-foreground">Counts unused linked savings budgets automatically.</p></div><Switch id="auto-count" checked={auto} onCheckedChange={setAuto} /></div><Button onClick={save} disabled={saving}>{initial ? "Save changes" : "Add goal"}</Button></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl border bg-card p-10 text-center text-sm text-muted-foreground shadow-soft">{text}</div>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="px-3 pb-2 text-start font-medium">{children}</th>; }
function Td({ children }: { children: React.ReactNode }) { return <td className="px-3 py-3">{children}</td>; }
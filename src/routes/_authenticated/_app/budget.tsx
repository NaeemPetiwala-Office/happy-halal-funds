import { createFileRoute } from "@tanstack/react-router";
import { PageSkeleton } from "@/components/EmptyState";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { SampleDataCard } from "@/components/SampleDataCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  categoriesQuery,
  friendlyError,
  goalsQuery,
  incomeSourcesQuery,
  useInvalidateData,
  type Category,
  type IncomeSource,
} from "@/lib/data";
import { profileQuery } from "@/lib/profile";
import { formatMoney } from "@/lib/format";
import {
  MAX_CATEGORIES,
  MAX_CATEGORY_NAME,
  canAddCategory,
  unallocated,
  validateCategoryName,
  validatePlanned,
} from "@/lib/budget-rules";

export const Route = createFileRoute("/_authenticated/_app/budget")({
  head: () => ({
    meta: [
      { title: "Budget — Halal Budget Planner" },
      { name: "description", content: "Plan your monthly income against spending, giving and savings categories." },
      { property: "og:title", content: "Budget — Halal Budget Planner" },
      { property: "og:description", content: "Plan your monthly income against spending, giving and savings categories." },
    ],
  }),
  component: Page,
});

const TYPES = ["Fixed", "Variable", "Giving", "Savings"] as const;
const NONE = "__none";

/** Text/number input that commits on blur or Enter and reverts if the commit fails. */
function InlineInput({
  value,
  onCommit,
  type = "text",
  label,
  maxLength,
  className = "",
}: {
  value: string;
  onCommit: (v: string) => Promise<boolean>;
  type?: string;
  label: string;
  maxLength?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(value);
  }
  const commit = async () => {
    if (draft === value) return;
    const ok = await onCommit(draft);
    if (!ok) setDraft(value);
  };
  return (
    <Input
      aria-label={label}
      type={type}
      inputMode={type === "number" ? "decimal" : undefined}
      step={type === "number" ? "0.01" : undefined}
      value={draft}
      maxLength={maxLength}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setDraft(value);
      }}
      className={`h-9 ${className}`}
    />
  );
}

function Page() {
  const { data: profile } = useQuery(profileQuery);
  const { data: sources = [] } = useQuery(incomeSourcesQuery);
  const { data: categories = [], isLoading: pageLoading } = useQuery(categoriesQuery);
  const { data: goals = [] } = useQuery(goalsQuery);
  const invalidate = useInvalidateData();
  const cur = profile?.currency ?? "USD";

  const totalIncome = sources.reduce((s, x) => s + Number(x.monthly_amount), 0);
  const totalPlanned = categories.reduce((s, x) => s + Number(x.planned), 0);
  const left = unallocated(
    sources.map((s) => Number(s.monthly_amount)),
    categories.map((c) => Number(c.planned)),
  );

  async function run(p: PromiseLike<{ error: unknown }>, ok?: string) {
    const { error } = await p;
    if (error) {
      toast.error(friendlyError(error));
      return false;
    }
    if (ok) toast.success(ok);
    invalidate();
    return true;
  }

  const updateSource = (s: IncomeSource, patch: Partial<IncomeSource>) =>
    run(supabase.from("income_sources").update(patch).eq("id", s.id));
  const updateCategory = (c: Category, patch: Partial<Category>) =>
    run(supabase.from("categories").update(patch).eq("id", c.id));

  async function addSource(): Promise<unknown> {
    if (sources.length >= 5) return toast.error("You can have up to 5 income sources.");
    let n = sources.length + 1;
    while (sources.some((s) => s.name === `Income ${n}`)) n++;
    return run(supabase.from("income_sources").insert({ name: `Income ${n}`, monthly_amount: 0 }));
  }

  async function addCategory(): Promise<unknown> {
    if (!canAddCategory(categories.length)) return toast.error(`You can have up to ${MAX_CATEGORIES} categories.`);
    let n = categories.length + 1;
    while (categories.some((c) => c.name === `New category ${n}`)) n++;
    return run(supabase.from("categories").insert({ name: `New category ${n}`, type: "Variable", planned: 0 }));
  }

  if (pageLoading) return <><PageHeader eyebrow="Plan" title="Budget" /><PageSkeleton /></>;
  return (
    <>
      <PageHeader eyebrow="Plan" title="Budget" />
      <div className="relative mx-auto -mt-6 flex max-w-6xl flex-col gap-6 px-5 md:px-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Total income" value={formatMoney(totalIncome, cur)} />
          <Stat label="Total planned" value={formatMoney(totalPlanned, cur)} />
          <Stat
            label={left < 0 ? "Over-allocated" : "Unallocated"}
            value={formatMoney(left, cur)}
            tone={left < 0 ? "bad" : "normal"}
            hint={left < 0 ? "You've planned more than your income. Reduce some categories." : undefined}
          />
        </div>

        <SampleDataCard />

        <Section
          title="Income sources"
          subtitle={`${sources.length} of 5 · expected each month`}
          action={
            <Button size="sm" className="rounded-full" onClick={addSource} disabled={sources.length >= 5}>
              <Plus className="size-4" /> Add source
            </Button>
          }
        >
          {sources.length === 0 ? (
            <Empty>Add where your money comes from, like a salary.</Empty>
          ) : (
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <Tr head>
                  <Th>Name</Th>
                  <Th className="w-44">Monthly amount</Th>
                  <Th className="w-12" />
                </Tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <InlineInput
                        label="Income source name"
                        value={s.name}
                        maxLength={40}
                        onCommit={async (v) => {
                          const n = v.trim();
                          if (!n) return toast.error("Name can't be empty."), false;
                          if (sources.some((o) => o.id !== s.id && o.name === n))
                            return toast.error("That name is already used."), false;
                          return updateSource(s, { name: n });
                        }}
                      />
                    </Td>
                    <Td>
                      <InlineInput
                        label="Monthly amount"
                        type="number"
                        value={String(s.monthly_amount)}
                        onCommit={async (v) => {
                          const n = Number(v);
                          if (v === "" || !Number.isFinite(n) || n < 0)
                            return toast.error("Amount must be 0 or more."), false;
                          return updateSource(s, { monthly_amount: Math.round(n * 100) / 100 });
                        }}
                      />
                    </Td>
                    <Td>
                      <DeleteBtn
                        label={`Delete ${s.name}`}
                        onClick={() => {
                          if (confirm(`Delete income source "${s.name}"? Logged income keeps its amount but loses the source.`))
                            run(supabase.from("income_sources").delete().eq("id", s.id), "Income source deleted");
                        }}
                      />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section
          title="Categories"
          subtitle={`${categories.length} of ${MAX_CATEGORIES} · leftovers move after each month ends`}
          action={
            <Button size="sm" className="rounded-full" onClick={addCategory} disabled={!canAddCategory(categories.length)}>
              <Plus className="size-4" /> Add category
            </Button>
          }
        >
          {categories.length === 0 ? (
            <Empty>Add categories like Rent, Groceries, Sadaqah or Savings.</Empty>
          ) : (
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <Tr head>
                  <Th>Name</Th>
                  <Th className="w-32">Type</Th>
                  <Th className="w-32">Planned</Th>
                  <Th className="w-48">Leftover goes to</Th>
                  <Th className="w-44">Goal</Th>
                  <Th>Notes</Th>
                  <Th className="w-12" />
                </Tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const dest =
                    c.leftover_mode === "drop"
                      ? "drop"
                      : c.leftover_mode === "move" && c.leftover_category_id
                        ? c.leftover_category_id
                        : "same";
                  return (
                    <Tr key={c.id}>
                      <Td>
                        <InlineInput
                          label="Category name"
                          value={c.name}
                          maxLength={MAX_CATEGORY_NAME}
                          onCommit={async (v) => {
                            const err = validateCategoryName(v, categories, c.id);
                            if (err) return toast.error(err), false;
                            return updateCategory(c, { name: v.trim() });
                          }}
                        />
                      </Td>
                      <Td>
                        <Select value={c.type} onValueChange={(v) => updateCategory(c, { type: v as Category["type"] })}>
                          <SelectTrigger className="h-9 rounded-full" aria-label="Type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Td>
                      <Td>
                        <InlineInput
                          label="Planned"
                          type="number"
                          value={String(c.planned)}
                          onCommit={async (v) => {
                            const n = v === "" ? NaN : Number(v);
                            const err = validatePlanned(n);
                            if (err) return toast.error(err), false;
                            return updateCategory(c, { planned: Math.round(n * 100) / 100 });
                          }}
                        />
                      </Td>
                      <Td>
                        <Select
                          value={dest}
                          onValueChange={(v) =>
                            updateCategory(
                              c,
                              v === "same" || v === "drop"
                                ? { leftover_mode: v, leftover_category_id: null }
                                : { leftover_mode: "move", leftover_category_id: v },
                            )
                          }
                        >
                          <SelectTrigger className="h-9 rounded-full" aria-label="Leftover destination">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="same">Same category</SelectItem>
                            <SelectItem value="drop">Drop it</SelectItem>
                            {categories
                              .filter((o) => o.id !== c.id)
                              .map((o) => (
                                <SelectItem key={o.id} value={o.id}>
                                  {o.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </Td>
                      <Td>
                        <Select
                          value={c.goal_id ?? NONE}
                          onValueChange={(v) => updateCategory(c, { goal_id: v === NONE ? null : v })}
                        >
                          <SelectTrigger className="h-9 rounded-full" aria-label="Goal link">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>No goal</SelectItem>
                            {goals.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Td>
                      <Td>
                        <InlineInput
                          label="Notes"
                          value={c.notes ?? ""}
                          maxLength={500}
                          onCommit={(v) => updateCategory(c, { notes: v.trim() || null })}
                        />
                      </Td>
                      <Td>
                        <DeleteBtn
                          label={`Delete ${c.name}`}
                          onClick={() => {
                            if (confirm(`Delete category "${c.name}"? Its transactions will become uncategorised.`))
                              run(supabase.from("categories").delete().eq("id", c.id), "Category deleted");
                          }}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>
      </div>
    </>
  );
}

function Stat({ label, value, tone = "normal", hint }: { label: string; value: string; tone?: "normal" | "bad"; hint?: string | undefined }) {
  return (
    <div className={`rounded-3xl border bg-card p-5 shadow-soft ${tone === "bad" ? "border-destructive/50" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${tone === "bad" ? "text-destructive" : ""}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-destructive">{hint}</p>}
    </div>
  );
}

function Section({ title, subtitle, action, children }: { title: string; subtitle: string; action: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

const Tr = ({ children, head }: { children: ReactNode; head?: boolean }) => (
  <tr className={head ? "text-start text-xs text-muted-foreground" : "border-t"}>{children}</tr>
);
const Th = ({ children, className = "" }: { children?: ReactNode; className?: string }) => (
  <th className={`px-1.5 pb-2 text-start font-medium ${className}`}>{children}</th>
);
const Td = ({ children }: { children: ReactNode }) => <td className="px-1.5 py-2 align-middle">{children}</td>;
const Empty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">{children}</p>
);
function DeleteBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-destructive" aria-label={label} onClick={onClick}>
      <Trash2 className="size-4" />
    </Button>
  );
}

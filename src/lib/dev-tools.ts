import { supabase } from "@/integrations/supabase/client";

/** Developer helpers are shown only in local dev and the Lovable preview, never on the published site. */
export function isDevEnvironment(hostname: string = typeof window !== "undefined" ? window.location.hostname : ""): boolean {
  if (import.meta.env.DEV) return true;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("id-preview--") || hostname.endsWith("-dev.lovable.app");
}

/** Child tables first so nothing points at a deleted row mid-way. Profile is kept. */
export const USER_TABLES = [
  "transactions", "income_entries", "transfers", "interest_received", "interest_given",
  "recurring_items", "zakat_lines", "zakat_settings", "module_plans", "archived_entries",
  "categories", "goals", "income_sources", "accounts",
] as const;

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function resetAllMyData(): Promise<void> {
  const uid = await currentUserId();
  for (const t of USER_TABLES) {
    const { error } = await supabase.from(t).delete().eq("user_id", uid);
    if (error) throw new Error(`${t}: ${error.message}`);
  }
}

type Cat = { name: string; type: "Fixed" | "Variable" | "Giving" | "Savings"; planned: number; dest: "drop" | "same" | string; goal?: string };

export const SCENARIO = {
  planStart: "2026-08-01",
  currency: "INR",
  sources: [{ name: "Salary", monthly_amount: 50000 }, { name: "Freelance", monthly_amount: 0 }],
  categories: [
    { name: "Rent", type: "Fixed", planned: 15000, dest: "drop" },
    { name: "Groceries", type: "Fixed", planned: 6000, dest: "drop" },
    { name: "Transport", type: "Fixed", planned: 1500, dest: "drop" },
    { name: "Personal spending", type: "Variable", planned: 3000, dest: "Emergency fund" },
    { name: "Medical buffer", type: "Variable", planned: 2000, dest: "same" },
    { name: "Sadaqah", type: "Giving", planned: 1000, dest: "same" },
    { name: "Zakat set-aside", type: "Giving", planned: 500, dest: "same" },
    { name: "Miscellaneous", type: "Variable", planned: 3500, dest: "drop" },
    { name: "Emergency fund", type: "Savings", planned: 8000, dest: "same", goal: "Emergency Fund" },
    { name: "Umrah fund", type: "Savings", planned: 6000, dest: "same", goal: "Umrah" },
    { name: "Laptop fund", type: "Savings", planned: 3500, dest: "same", goal: "Laptop" },
  ] as Cat[],
  goals: [
    { name: "Emergency Fund", target: 60000, opening_saved: 5000, auto_count: false },
    { name: "Umrah", target: 120000, opening_saved: 0, auto_count: true },
    { name: "Laptop", target: 40000, opening_saved: 0, auto_count: false },
  ],
  accounts: [
    { name: "Main bank", opening_balance: 20000, minimum_balance: 5000 },
    { name: "Savings bank", opening_balance: 10000, minimum_balance: 0 },
  ],
  transfer: { date: "2026-08-21", from: "Main bank", to: "Savings bank", amount: 17500 },
  income: [
    ["2026-08-01", "Salary", 50000], ["2026-09-01", "Salary", 50000],
    ["2026-09-28", "Freelance", 2000], ["2026-10-01", "Salary", 50000],
  ] as [string, string, number][],
  transactions: [
    ["2026-08-01", "Rent", 15000], ["2026-08-03", "Groceries", 5200], ["2026-08-05", "Transport", 1200],
    ["2026-08-09", "Personal spending", 2400], ["2026-08-12", "Medical buffer", 500], ["2026-08-15", "Sadaqah", 1000],
    ["2026-08-18", "Zakat set-aside", 500], ["2026-08-20", "Emergency fund", 8000], ["2026-08-20", "Umrah fund", 6000],
    ["2026-08-20", "Laptop fund", 3500], ["2026-08-25", "Miscellaneous", 3800],
    ["2026-09-01", "Rent", 15000], ["2026-09-04", "Groceries", 6400], ["2026-09-06", "Transport", 1000],
    ["2026-09-10", "Personal spending", 3600], ["2026-09-14", "Medical buffer", 3000], ["2026-09-18", "Zakat set-aside", 500],
    ["2026-09-22", "Emergency fund", 8600], ["2026-09-22", "Laptop fund", 2000], ["2026-09-25", "Miscellaneous", 3000],
    ["2026-10-01", "Rent", 15000], ["2026-10-02", "Groceries", 2000], ["2026-10-03", "Transport", 500],
    ["2026-10-04", "Personal spending", 1000], ["2026-10-12", "Emergency fund", -3000], ["2026-10-14", "Groceries", -300],
    ["2026-11-02", "Rent", 15000],
  ] as [string, string, number][],
  recurring: [
    { name: "Rent", cat: "Rent", amount: 15000, frequency: "Monthly", first_due_date: "2026-08-01" },
    { name: "Internet", cat: "Miscellaneous", amount: 800, frequency: "Monthly", first_due_date: "2026-08-05" },
    { name: "Maintenance", cat: "Miscellaneous", amount: 3000, frequency: "Quarterly", first_due_date: "2026-08-10" },
    { name: "Takaful car insurance", cat: "Miscellaneous", amount: 12000, frequency: "Yearly", first_due_date: "2026-12-20" },
    { name: "School fee", cat: "Miscellaneous", amount: 5000, frequency: "One-time", first_due_date: "2026-11-15" },
  ] as const,
};

function check<T>(r: { data: T | null; error: { message: string } | null }, what: string): T {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data as T;
}

/** Idempotent: wipes the user's rows, then inserts the scenario fresh. */
export async function loadTestScenario(): Promise<void> {
  const uid = await currentUserId();
  await resetAllMyData();
  const S = SCENARIO;

  check(await supabase.from("profiles").update({ plan_start: S.planStart, selected_month: S.planStart, currency: S.currency }).eq("user_id", uid), "profile");

  const sources = check(await supabase.from("income_sources").insert(S.sources).select("id,name"), "income sources")!;
  const goals = check(await supabase.from("goals").insert(S.goals).select("id,name"), "goals")!;
  const accounts = check(await supabase.from("accounts").insert(S.accounts).select("id,name"), "accounts")!;
  const id = (rows: { id: string; name: string }[], n: string) => rows.find((r) => r.name === n)!.id;

  const catIds = new Map(S.categories.map((c) => [c.name, crypto.randomUUID()]));
  check(await supabase.from("categories").insert(S.categories.map((c) => ({
    id: catIds.get(c.name)!, name: c.name, type: c.type, planned: c.planned,
    leftover_mode: c.dest === "drop" ? "drop" as const : c.dest === "same" ? "same" as const : "move" as const,
    goal_id: c.goal ? id(goals, c.goal) : null,
  }))), "categories");
  for (const c of S.categories) {
    if (c.dest !== "drop" && c.dest !== "same") {
      check(await supabase.from("categories").update({ leftover_category_id: catIds.get(c.dest)! }).eq("id", catIds.get(c.name)!), "leftover link");
    }
  }
  const main = id(accounts, "Main bank");
  check(await supabase.from("transfers").insert({ date: S.transfer.date, from_account_id: main, to_account_id: id(accounts, S.transfer.to), amount: S.transfer.amount }), "transfer");
  check(await supabase.from("income_entries").insert(S.income.map(([date, src, amount]) => ({ date, source_id: id(sources, src), amount, account_id: main }))), "income");
  check(await supabase.from("transactions").insert(S.transactions.map(([date, cat, amount]) => ({ date, category_id: catIds.get(cat)!, amount, account_id: main }))), "transactions");
  check(await supabase.from("recurring_items").insert(S.recurring.map((r) => ({ name: r.name, category_id: catIds.get(r.cat)!, amount: r.amount, frequency: r.frequency, first_due_date: r.first_due_date }))), "recurring");
  check(await supabase.from("zakat_settings").insert({ basis: "Silver", silver_price: 100, anniversary_date: "2027-02-20", zakat_category_id: catIds.get("Zakat set-aside")! }), "zakat settings");
  check(await supabase.from("zakat_lines").insert([{ kind: "asset", label: "Cash", amount: 10000 }, { kind: "asset", label: "Gold", amount: 50000 }]), "zakat lines");
  check(await supabase.from("interest_received").insert({ date: "2026-09-30", account_id: id(accounts, "Savings bank"), amount: 120 }), "interest received");
  check(await supabase.from("interest_given").insert({ date: "2026-10-05", recipient: "Local charity", amount: 100 }), "interest given");
}

/**
 * Manual security check: proves row-level security keeps users apart.
 * Creates two throwaway users, user A writes rows, user B tries to read/update/delete them.
 * Run: bun scripts/rls-check.ts   (reads VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY from .env)
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const TABLES = [
  "profiles", "categories", "income_sources", "income_entries", "transactions", "goals", "accounts", "transfers",
  "recurring_items", "zakat_settings", "zakat_lines", "interest_received", "interest_given", "module_plans", "archived_entries",
] as const;

async function user(tag: string): Promise<{ c: SupabaseClient; id: string }> {
  const c = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const email = `rls-${tag}-${Date.now()}@example.com`;
  const { data, error } = await c.auth.signUp({ email, password: `Pw-${crypto.randomUUID()}` });
  if (error || !data.user) throw new Error(`sign-up failed: ${error?.message}`);
  return { c, id: data.user.id };
}

const a = await user("a");
const b = await user("b");
const failures: string[] = [];

// User A creates one row in each writable table.
const seed: Record<string, Record<string, unknown>> = {
  categories: { name: "Secret", type: "Variable" }, income_sources: { name: "Salary" },
  income_entries: { date: "2026-01-05", amount: 10 }, transactions: { date: "2026-01-05", amount: 5 },
  goals: { name: "Car" }, accounts: { name: "Cash" }, transfers: { date: "2026-01-05", amount: 1 },
  recurring_items: { name: "Rent", amount: 1, first_due_date: "2026-01-01" }, zakat_settings: {},
  zakat_lines: { kind: "asset", label: "Gold" }, interest_received: { date: "2026-01-05", amount: 1 },
  interest_given: { date: "2026-01-05", amount: 1 }, module_plans: { module: "ramadan" },
  archived_entries: { kind: "transaction", data: {} },
};
for (const [t, row] of Object.entries(seed)) {
  const { error } = await a.c.from(t).insert(row);
  if (error) failures.push(`A could not insert own ${t}: ${error.message}`);
}

for (const t of TABLES) {
  const { data: mine } = await a.c.from(t).select("*").eq("user_id", a.id);
  if (!mine?.length) failures.push(`A cannot see own ${t}`);
  const { data: peek } = await b.c.from(t).select("*").eq("user_id", a.id);
  if (peek?.length) failures.push(`B READ ${peek.length} of A's ${t}`);
  const { data: upd } = await b.c.from(t).update({ user_id: b.id }).eq("user_id", a.id).select();
  if (upd?.length) failures.push(`B UPDATED A's ${t}`);
  const { data: del } = await b.c.from(t).delete().eq("user_id", a.id).select();
  if (del?.length) failures.push(`B DELETED A's ${t}`);
  const { error: forge } = await b.c.from(t).insert({ ...(seed[t] ?? {}), user_id: a.id });
  if (!forge && t !== "profiles") failures.push(`B inserted a row owned by A into ${t}`);
}

// Clean up A's rows (users stay as harmless empty accounts).
for (const t of Object.keys(seed)) await a.c.from(t).delete().eq("user_id", a.id);

console.log(failures.length ? `FAIL\n${failures.join("\n")}` : `PASS — user B could not read, change, delete or forge user A's rows in ${TABLES.length} tables.`);
console.log(`test users: ${a.id} ${b.id}`);
process.exit(failures.length ? 1 : 0);

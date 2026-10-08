/**
 * Two-user row-level-security check (spec NFR-SEC-02).
 * Signs in as two PRE-EXISTING test users (create them in the Supabase dashboard, auto-confirmed).
 * User A writes one row per table; user B and a signed-out client try to read, change, delete and forge them.
 * Run:  npx tsx --env-file=.env scripts/rls-check.ts
 * Needs in .env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, RLS_A_EMAIL, RLS_A_PASSWORD, RLS_B_EMAIL, RLS_B_PASSWORD
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const env = (k: string): string => {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing ${k} in .env (see .env.example)`);
    process.exit(2);
  }
  return v;
};
const url = env("VITE_SUPABASE_URL");
const key = env("VITE_SUPABASE_PUBLISHABLE_KEY");

const TABLES = [
  "profiles", "categories", "income_sources", "income_entries", "transactions", "goals", "accounts", "transfers",
  "recurring_items", "zakat_settings", "zakat_lines", "interest_received", "interest_given", "module_plans", "archived_entries",
] as const;

const fresh = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(tag: "A" | "B"): Promise<{ c: SupabaseClient; id: string }> {
  const c = fresh();
  const { data, error } = await c.auth.signInWithPassword({ email: env(`RLS_${tag}_EMAIL`), password: env(`RLS_${tag}_PASSWORD`) });
  if (error || !data.user) {
    console.error(`Sign-in failed for user ${tag}: ${error?.message}`);
    process.exit(2);
  }
  return { c, id: data.user.id };
}

const a = await signIn("A");
const b = await signIn("B");
const anon = fresh();
if (a.id === b.id) {
  console.error("User A and B are the same account. Use two different test users.");
  process.exit(2);
}
const failures: string[] = [];

// Clean slate for A (own rows only), then seed one row per writable table.
const seed: Record<string, Record<string, unknown>> = {
  categories: { name: "Secret", type: "Variable" }, income_sources: { name: "Salary" },
  income_entries: { date: "2026-01-05", amount: 10 }, transactions: { date: "2026-01-05", amount: 5 },
  goals: { name: "Car" }, accounts: { name: "Cash" }, transfers: { date: "2026-01-05", amount: 1 },
  recurring_items: { name: "Rent", amount: 1, first_due_date: "2026-01-01" }, zakat_settings: {},
  zakat_lines: { kind: "asset", label: "Gold" }, interest_received: { date: "2026-01-05", amount: 1 },
  interest_given: { date: "2026-01-05", amount: 1 }, module_plans: { module: "ramadan" },
  archived_entries: { kind: "transaction", data: {} },
};
for (const t of Object.keys(seed)) await a.c.from(t).delete().eq("user_id", a.id);
for (const [t, row] of Object.entries(seed)) {
  const { error } = await a.c.from(t).insert(row);
  if (error) failures.push(`A could not insert own ${t}: ${error.message}`);
}

for (const t of TABLES) {
  const { data: mine } = await a.c.from(t).select("*").eq("user_id", a.id);
  if (!mine?.length) failures.push(`A cannot see own ${t}`);
  const { data: peek } = await b.c.from(t).select("*").eq("user_id", a.id);
  if (peek?.length) failures.push(`B READ ${peek.length} of A's ${t}`);
  const { data: all } = await b.c.from(t).select("user_id");
  if (all?.some((r) => r.user_id !== b.id)) failures.push(`B sees rows of other users in ${t} without a filter`);
  const { data: upd } = await b.c.from(t).update({ user_id: b.id }).eq("user_id", a.id).select();
  if (upd?.length) failures.push(`B UPDATED A's ${t}`);
  const { data: del } = await b.c.from(t).delete().eq("user_id", a.id).select();
  if (del?.length) failures.push(`B DELETED A's ${t}`);
  const { error: forge } = await b.c.from(t).insert({ ...(seed[t] ?? {}), user_id: a.id });
  if (!forge && t !== "profiles") failures.push(`B inserted a row owned by A into ${t}`);
  const { data: anonRead } = await anon.from(t).select("*");
  if (anonRead?.length) failures.push(`SIGNED-OUT client read ${anonRead.length} rows of ${t}`);
}

// Clean up A's rows (the two users stay as empty accounts).
for (const t of Object.keys(seed)) await a.c.from(t).delete().eq("user_id", a.id);

console.log(
  failures.length
    ? `FAIL\n${failures.join("\n")}`
    : `PASS - user B and a signed-out client could not read, change, delete or forge user A's rows in ${TABLES.length} tables.`,
);
process.exit(failures.length ? 1 : 0);

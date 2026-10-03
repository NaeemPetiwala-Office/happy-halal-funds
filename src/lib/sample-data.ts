import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "./format";

/** Seeds a small, realistic demo dataset for the signed-in user. */
export async function seedSampleData() {
  const today = todayISO();
  const ym = today.slice(0, 7);
  const day = Number(today.slice(8, 10));
  const d = (n: number) => `${ym}-${String(Math.min(n, day)).padStart(2, "0")}`;

  const must = <T,>(r: { data: T | null; error: unknown }): NonNullable<T> => {
    if (r.error) throw r.error;
    return r.data as NonNullable<T>;
  };

  const accounts = must(
    await supabase
      .from("accounts")
      .insert([
        { name: "Current account", opening_balance: 1500, minimum_balance: 200 },
        { name: "Cash wallet", opening_balance: 120 },
      ])
      .select(),
  );
  const bank = accounts[0]!.id;
  const cash = accounts[1]!.id;

  const sources = must(
    await supabase
      .from("income_sources")
      .insert([
        { name: "Salary", monthly_amount: 3200 },
        { name: "Freelance", monthly_amount: 400 },
      ])
      .select(),
  );

  const goal = must(
    await supabase
      .from("goals")
      .insert({ name: "Emergency fund", target: 6000, opening_saved: 800, priority: "High" })
      .select()
      .single(),
  );

  const note = "Sample data";
  const cats = must(
    await supabase
      .from("categories")
      .insert([
        { name: "Rent", type: "Fixed", planned: 1200, notes: note },
        { name: "Utilities", type: "Fixed", planned: 180, notes: note },
        { name: "Groceries", type: "Variable", planned: 450, notes: note },
        { name: "Transport", type: "Variable", planned: 150, notes: note },
        { name: "Eating out", type: "Variable", planned: 120, leftover_mode: "drop", notes: note },
        { name: "Sadaqah", type: "Giving", planned: 150, notes: note },
        { name: "Emergency savings", type: "Savings", planned: 500, goal_id: (goal as unknown as { id: string }).id, notes: note },
      ])
      .select(),
  );
  const ids = new Map(cats.map((x) => [x.name, x.id]));
  const c = (n: string) => ids.get(n) ?? null;

  must(
    await supabase.from("income_entries").insert([
      { date: d(1), source_id: sources[0]!.id, amount: 3200, account_id: bank, note: "Monthly salary" },
      { date: d(10), source_id: sources[1]!.id, amount: 350, account_id: bank, note: "Website project" },
    ]),
  );

  must(
    await supabase.from("transactions").insert([
      { date: d(1), category_id: c("Rent"), amount: 1200, account_id: bank, note: "Rent" },
      { date: d(3), category_id: c("Groceries"), amount: 86.4, account_id: bank, note: "Weekly shop" },
      { date: d(4), category_id: c("Transport"), amount: 45, account_id: bank, note: "Bus pass" },
      { date: d(5), category_id: c("Sadaqah"), amount: 50, account_id: cash, note: "Masjid donation" },
      { date: d(6), category_id: c("Utilities"), amount: 92.15, account_id: bank, note: "Electricity" },
      { date: d(7), category_id: c("Emergency savings"), amount: 500, account_id: bank, note: "Monthly saving" },
      { date: d(9), category_id: c("Eating out"), amount: 32.5, account_id: cash, note: "Family dinner" },
      { date: d(10), category_id: c("Groceries"), amount: 104.2, account_id: bank, note: "Weekly shop" },
      { date: d(11), category_id: c("Groceries"), amount: -12.99, account_id: bank, note: "Refund — damaged item" },
    ]),
  );
}

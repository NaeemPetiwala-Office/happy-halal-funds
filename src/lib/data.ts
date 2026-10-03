import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Category = Tables<"categories">;
export type IncomeSource = Tables<"income_sources">;
export type IncomeEntry = Tables<"income_entries">;
export type Transaction = Tables<"transactions">;
export type Account = Tables<"accounts">;
export type Goal = Tables<"goals">;

function listQuery<T extends "categories" | "income_sources" | "accounts" | "goals">(table: T) {
  return queryOptions({
    queryKey: ["data", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order("created_at");
      if (error) throw error;
      return data as Tables<T>[];
    },
  });
}

export const categoriesQuery = listQuery("categories");
export const incomeSourcesQuery = listQuery("income_sources");
export const accountsQuery = listQuery("accounts");
export const goalsQuery = listQuery("goals");

export const transactionsQuery = queryOptions({
  queryKey: ["data", "transactions"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw error;
    return data;
  },
});

export const incomeEntriesQuery = queryOptions({
  queryKey: ["data", "income_entries"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("income_entries")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export function useInvalidateData() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["data"] });
}

/** Turn database errors into plain, friendly sentences. */
export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/row limit|limit reached|maximum/i.test(msg)) return "You've reached the maximum number of items for this list.";
  if (/duplicate key|unique/i.test(msg)) return "That name is already used. Names must be unique.";
  if (/check constraint/i.test(msg)) return "That value isn't allowed. Please check it and try again.";
  return msg;
}

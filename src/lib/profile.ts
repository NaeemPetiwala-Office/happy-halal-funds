import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

/** "2026-10" -> "2026-10-01" */
export function monthInputToDate(v: string): string {
  return `${v}-01`;
}
/** "2026-10-01" -> "2026-10" */
export function dateToMonthInput(d: string | null | undefined): string {
  return d ? d.slice(0, 7) : "";
}
export function currentMonthInput(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

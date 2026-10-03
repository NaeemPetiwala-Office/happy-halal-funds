import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { profileQuery } from "@/lib/profile";
import { monthLabel } from "@/lib/format";
import { friendlyError } from "@/lib/data";

/** Global month picker; the choice is saved to the profile so every screen shares it. */
export function MonthSwitcher({ months, k }: { months: string[]; k: number }) {
  const qc = useQueryClient();
  async function go(i: number) {
    const m = months[i];
    if (!m) return;
    const date = `${m}-01`;
    qc.setQueryData(profileQuery.queryKey, (old) => (old ? { ...old, selected_month: date } : old));
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("profiles").update({ selected_month: date }).eq("user_id", auth.user.id);
    if (error) toast.error(friendlyError(error));
    qc.invalidateQueries({ queryKey: profileQuery.queryKey });
  }
  return (
    <div className="flex items-center gap-1 rounded-full bg-card/15 p-1 backdrop-blur">
      <button type="button" className="glass-btn" aria-label="Previous month" disabled={k <= 0} onClick={() => go(k - 1)}>
        <ChevronLeft className="size-5 rtl:rotate-180" />
      </button>
      <Select value={months[k]} onValueChange={(v) => go(months.indexOf(v))}>
        <SelectTrigger aria-label="Selected month" className="h-10 w-44 rounded-full border-0 bg-card text-card-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((m, i) => (
            <SelectItem key={m} value={m}>
              {monthLabel(m)} · M{i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button type="button" className="glass-btn" aria-label="Next month" disabled={k >= months.length - 1} onClick={() => go(k + 1)}>
        <ChevronRight className="size-5 rtl:rotate-180" />
      </button>
    </div>
  );
}

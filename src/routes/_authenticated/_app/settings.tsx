import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/ThemeToggle";
import { CURRENCIES } from "@/lib/currencies";
import { dateToMonthInput, monthInputToDate, profileQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Halal Budget Planner" },
      { name: "description", content: "Update your name, currency and plan start month." },
      { property: "og:title", content: "Settings — Halal Budget Planner" },
      { property: "og:description", content: "Update your name, currency and plan start month." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQuery),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: profile } = useSuspenseQuery(profileQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [name, setName] = useState(profile?.name ?? "");
  const [currency, setCurrency] = useState(profile?.currency ?? "USD");
  const [month, setMonth] = useState(dateToMonthInput(profile?.plan_start));
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() || null, currency, plan_start: monthInputToDate(month) })
      .eq("user_id", profile.user_id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: profileQuery.queryKey });
    toast.success("Settings saved");
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <>
      <PageHeader eyebrow="Preferences" title="Settings" />
      <div className="mx-auto -mt-6 max-w-5xl space-y-5 px-5 md:px-16">
        <form onSubmit={save} className="space-y-5 rounded-3xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg">Profile</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input id="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-11 w-full rounded-full border bg-input px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Plan start month</Label>
              <Input id="month" type="month" required value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="h-11 px-8" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-card p-6 shadow-soft">
          <div>
            <h2 className="text-lg">Appearance</h2>
            <p className="text-sm text-muted-foreground">{dark ? "Dark" : "Light"} theme</p>
          </div>
          <Button variant="outline" onClick={toggle}>
            Switch to {dark ? "light" : "dark"}
          </Button>
        </div>

        <Button variant="outline" onClick={signOut} className="h-11">
          <LogOut /> Sign out
        </Button>
      </div>
    </>
  );
}

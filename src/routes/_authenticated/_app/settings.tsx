import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/MonthPicker";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/ThemeToggle";
import { ModulesCard, NewYearCard } from "@/components/SettingsExtras";
import { DataCard } from "@/components/DataCard";
import { applyLocale, LOCALES, useLocale, type Locale } from "@/lib/i18n";
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
  const { t, locale } = useLocale();

  async function changeLocale(l: Locale) {
    if (!profile) return;
    applyLocale(l);
    qc.setQueryData(profileQuery.queryKey, (old) => (old ? { ...old, locale: l } : old));
    const { error } = await supabase.from("profiles").update({ locale: l }).eq("user_id", profile.user_id);
    if (error) toast.error(error.message);
  }

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
    await qc.refetchQueries({ queryKey: profileQuery.queryKey, type: "all" });
    toast.success(t("Settings saved"));
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    try { localStorage.removeItem("hbp-cache"); } catch { /* ignore */ }
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <>
      <PageHeader eyebrow={t("Preferences")} title={t("Settings")} />
      <div className="relative mx-auto -mt-6 max-w-5xl space-y-5 px-5 pb-24 md:px-16">
        <form onSubmit={save} className="space-y-5 rounded-3xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg">{t("Profile")}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">{t("Name (optional)")}</Label>
              <Input id="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t("Currency")}</Label>
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
              <Label htmlFor="month">{t("Plan start month")}</Label>
              <MonthPicker id="month" value={month} onChange={setMonth} />
            </div>
          </div>
          <Button type="submit" className="h-11 px-8" disabled={busy}>
            {busy ? t("Saving…") : t("Save changes")}
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-card p-6 shadow-soft">
          <div>
            <h2 className="text-lg">{t("Appearance")}</h2>
            <p className="text-sm text-muted-foreground">{t(dark ? "Dark theme" : "Light theme")}</p>
          </div>
          <Button variant="outline" onClick={toggle}>
            {t(dark ? "Switch to light" : "Switch to dark")}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-card p-6 shadow-soft">
          <Label htmlFor="locale" className="text-lg font-display">{t("Language")}</Label>
          <select
            id="locale"
            value={locale}
            onChange={(e) => changeLocale(e.target.value as Locale)}
            className="h-11 rounded-full border bg-input px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>

        <DataCard />
        <ModulesCard />
        <NewYearCard />

        <Button variant="outline" onClick={signOut} className="h-11">
          <LogOut /> {t("Sign out")}
        </Button>
      </div>
    </>
  );
}

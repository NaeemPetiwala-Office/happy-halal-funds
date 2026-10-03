import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/MonthPicker";
import { Label } from "@/components/ui/label";
import { CURRENCIES } from "@/lib/currencies";
import { currentMonthInput, monthInputToDate, profileQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Get set up — Halal Budget Planner" },
      { name: "description", content: "Three quick steps to start your plan." },
      { property: "og:title", content: "Get set up — Halal Budget Planner" },
      { property: "og:description", content: "Three quick steps to start your plan." },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const p = await context.queryClient.ensureQueryData(profileQuery);
    if (p?.onboarding_completed) throw redirect({ to: "/dashboard" });
  },
  component: Onboarding,
});

const STEPS = ["Your name", "Currency", "Plan start"];

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = Route.useRouteContext();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [month, setMonth] = useState(currentMonthInput());
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim() || null,
        currency,
        plan_start: monthInputToDate(month),
        selected_month: monthInputToDate(month),
        onboarding_completed: true,
      })
      .eq("user_id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await qc.refetchQueries({ queryKey: profileQuery.queryKey, type: "all" });
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen">
      <div className="bg-header-gradient rounded-b-[2.5rem] px-6 pb-20 pt-10 text-primary-foreground">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
            Step {step + 1} of 3
          </p>
          <h1 className="mt-2 text-3xl font-bold">{STEPS[step]}</h1>
          <div className="mt-5 flex gap-2" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary-foreground" : "bg-primary-foreground/30"}`} />
            ))}
          </div>
        </div>
      </div>
      <div className="relative mx-auto -mt-12 max-w-md px-5 pb-12">
        <form
          className="space-y-5 rounded-3xl border bg-card p-6 shadow-soft"
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 2) setStep(step + 1);
            else finish();
          }}
        >
          {step === 0 && (
            <div className="space-y-2">
              <Label htmlFor="name">What should we call you? (optional)</Label>
              <Input id="name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
          )}
          {step === 1 && (
            <div className="space-y-2">
              <Label htmlFor="currency">Which currency do you budget in?</Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-11 w-full rounded-full border bg-input px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} — {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-2">
              <Label htmlFor="month">Which month does your plan start?</Label>
              <MonthPicker id="month" value={month} onChange={setMonth} />
              <p className="ps-4 text-xs text-muted-foreground">Your plan covers 24 months from the 1st of this month.</p>
            </div>
          )}
          <div className="flex gap-3">
            {step > 0 && (
              <Button type="button" variant="outline" className="h-11 flex-1" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button type="submit" className="h-11 flex-1" disabled={busy}>
              {step < 2 ? "Continue" : busy ? "Saving…" : "Start planning"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

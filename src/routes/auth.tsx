import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Halal Budget Planner" },
      { name: "description", content: "Sign in or create your Halal Budget Planner account." },
      { property: "og:title", content: "Sign in — Halal Budget Planner" },
      { property: "og:description", content: "Sign in or create your Halal Budget Planner account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/onboarding", replace: true });
        else setSent(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="bg-header-gradient relative rounded-b-[2.5rem] px-6 pb-20 pt-10 text-primary-foreground">
        <ThemeToggle className="glass-btn absolute end-5 top-5 text-primary-foreground" />
        <div className="mx-auto max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">Halal Budget Planner</p>
          <h1 className="mt-2 text-3xl font-bold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm opacity-80">Private, interest-free budgeting. No ads, no trackers.</p>
        </div>
      </div>

      <div className="relative mx-auto -mt-12 w-full max-w-md px-5 pb-12">
        <div className="rounded-3xl border bg-card p-6 shadow-soft">
          {sent ? (
            <div className="py-4 text-center">
              <h2 className="text-lg">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Open it to finish
                creating your account.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setMode("signin"); }}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div role="tablist" className="mb-6 grid grid-cols-2 rounded-full bg-muted p-1">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={`rounded-full py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"
                    }`}
                  >
                    {m === "signin" ? "Sign in" : "Sign up"}
                  </button>
                ))}
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {mode === "signup" && <p className="ps-4 text-xs text-muted-foreground">At least 6 characters.</p>}
                </div>
                <Button type="submit" className="h-11 w-full" disabled={busy}>
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

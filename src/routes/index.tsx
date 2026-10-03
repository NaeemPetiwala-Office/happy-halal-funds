import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, HandCoins } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Halal Budget Planner — Interest-free monthly budgeting" },
      {
        name: "description",
        content: "Plan income against categories, carry leftovers forward, and track Zakat — private and interest-free.",
      },
      { property: "og:title", content: "Halal Budget Planner — Interest-free monthly budgeting" },
      {
        property: "og:description",
        content: "Plan income against categories, carry leftovers forward, and track Zakat — private and interest-free.",
      },
    ],
  }),
  component: Index,
});

const points = [
  { icon: Sparkles, title: "Leftovers carry forward", text: "Unspent money rolls into next month automatically." },
  { icon: HandCoins, title: "Zakat & giving", text: "Transparent Zakat estimates and interest purification." },
  { icon: ShieldCheck, title: "Private by design", text: "No ads, no trackers, no bank scraping." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <section className="bg-header-gradient relative rounded-b-[3rem] px-6 pb-24 pt-14 text-primary-foreground">
        <ThemeToggle className="glass-btn absolute end-5 top-5 text-primary-foreground" />
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-75">Halal Budget Planner</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">A calm, interest-free way to plan every month.</h1>
          <p className="mt-4 max-w-xl opacity-85">Give every unit of income a job, log spending in seconds, and let leftovers move forward on their own.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="shadow-soft">
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-card text-foreground shadow-soft hover:bg-secondary">
              <Link to="/auth">Open my planner</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="relative mx-auto -mt-12 grid max-w-3xl gap-4 px-5 pb-16 md:grid-cols-3">
        {points.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border bg-card p-6 shadow-soft">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-mint text-mint-foreground">
              <Icon className="size-5" />
            </div>
            <h2 className="mt-4 text-base">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

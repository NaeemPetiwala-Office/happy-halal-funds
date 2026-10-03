import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { profileQuery } from "@/lib/profile";
import { Moon, Gift, Plane } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SECONDARY_NAV } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/_app/more")({
  head: () => ({
    meta: [
      { title: "More — Halal Budget Planner" },
      { name: "description", content: "Goals, accounts, recurring payments, Zakat, interest and optional planners." },
      { property: "og:title", content: "More — Halal Budget Planner" },
      { property: "og:description", content: "Goals, accounts, recurring payments, Zakat, interest and optional planners." },
    ],
  }),
  component: MorePage,
});

const PLANNERS = [
  { to: "/ramadan", key: "ramadan", label: "Ramadan", icon: Moon },
  { to: "/qurbani", key: "qurbani", label: "Qurbani", icon: Gift },
  { to: "/hajj", key: "hajj", label: "Hajj & Umrah", icon: Plane },
] as const;

function Tile({ to, label, Icon }: { to: string; label: string; Icon: typeof Moon }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-3xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-11 items-center justify-center rounded-2xl bg-mint text-mint-foreground">
        <Icon className="size-5" />
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function MorePage() {
  const { data: profile } = useQuery(profileQuery);
  const mods = (profile?.modules ?? {}) as Record<string, boolean>;
  const planners = PLANNERS.filter((p) => mods[p.key]);
  return (
    <>
      <PageHeader eyebrow="Everything else" title="More" />
      <div className="relative mx-auto -mt-6 max-w-5xl space-y-6 px-5 md:px-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECONDARY_NAV.map(({ to, label, icon }) => (
            <Tile key={to} to={to} label={label} Icon={icon} />
          ))}
        </div>
        {planners.length > 0 && <div>
          <h2 className="mb-3 ps-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Optional planners</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {planners.map(({ to, label, icon }) => (
              <Tile key={to} to={to} label={label} Icon={icon} />
            ))}
          </div>
        </div>}
        <p className="ps-2 text-sm text-muted-foreground">Ramadan, Qurbani and Hajj &amp; Umrah planners can be switched on in <Link to="/settings" className="font-medium text-primary">Settings → Modules</Link>.</p>
      </div>
    </>
  );
}

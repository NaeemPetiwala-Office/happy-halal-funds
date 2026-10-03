import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { QuickAddProvider } from "./QuickAdd";
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  PieChart,
  MoreHorizontal,
  Wallet,
  Target,
  Landmark,
  Repeat,
  HandCoins,
  Scale,
  HeartPulse,
  Settings,
} from "lucide-react";

export const PRIMARY_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/add", label: "Add", icon: PlusCircle },
  { to: "/log", label: "Log", icon: ListOrdered },
  { to: "/budget", label: "Budget", icon: PieChart },
  { to: "/more", label: "More", icon: MoreHorizontal },
] as const;

export const SECONDARY_NAV = [
  { to: "/income", label: "Income", icon: Wallet },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/accounts", label: "Accounts", icon: Landmark },
  { to: "/recurring", label: "Recurring", icon: Repeat },
  { to: "/zakat", label: "Zakat", icon: HandCoins },
  { to: "/interest", label: "Interest", icon: Scale },
  { to: "/health", label: "Health check", icon: HeartPulse },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const sideLink =
  "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const sideActive = { className: "bg-secondary text-secondary-foreground" };

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <QuickAddProvider>
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e bg-card px-4 py-6 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-3 px-2">
          <span className="bg-header-gradient flex size-10 items-center justify-center rounded-2xl font-display text-lg font-bold text-primary-foreground">
            H
          </span>
          <span className="font-display text-sm font-semibold leading-tight">
            Halal Budget
            <br />
            Planner
          </span>
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={sideLink} activeProps={sideActive}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <p className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Manage
        </p>
        <nav aria-label="Manage" className="mt-2 flex flex-col gap-1 overflow-y-auto">
          {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className={sideLink} activeProps={sideActive}>
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 pb-28 md:pb-12">{children}</main>

      <nav
        aria-label="Main"
        className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full border bg-card/95 px-2 py-2 shadow-lift backdrop-blur md:hidden"
      >
        {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            activeProps={{ className: "text-primary" }}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
    </QuickAddProvider>
  );
}

import type { ReactNode } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function PageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="bg-header-gradient rounded-b-[2.5rem] px-5 pb-10 pt-8 text-primary-foreground shadow-soft md:mx-6 md:mt-6 md:rounded-[2.5rem] md:px-10">
      <div className="mx-auto flex max-w-5xl items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle className="glass-btn text-primary-foreground" />
        </div>
      </div>
    </header>
  );
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} />
      <div className="relative mx-auto -mt-6 max-w-5xl px-5 md:px-16">
        <div className="rounded-3xl border bg-card p-8 text-center shadow-soft">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-mint text-mint-foreground">
            {icon}
          </div>
          <h2 className="mt-4 text-lg">Coming soon</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </>
  );
}

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { translate } from "@/lib/i18n";

export function EmptyState({ title = "Nothing here yet", text, icon, action }: { title?: string; text: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border bg-card p-8 text-center shadow-soft">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-mint text-mint-foreground" aria-hidden="true">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <h2 className="mt-4 text-lg">{translate(title)}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/** Card-shaped placeholders shown while a page's data loads. */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div role="status" aria-label={translate("Loading…")} className="relative mx-auto -mt-6 max-w-5xl space-y-4 px-5 md:px-16">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
      </div>
      {Array.from({ length: cards }, (_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}
      <span className="sr-only">{translate("Loading…")}</span>
    </div>
  );
}

import type { Status } from "@/lib/engine";

const STYLES: Record<Status, string> = {
  "Over budget": "bg-destructive/15 text-destructive",
  "Near limit": "bg-accent/25 text-accent-foreground dark:text-accent",
  Done: "bg-primary text-primary-foreground",
  "On track": "bg-secondary text-secondary-foreground",
  "Not started": "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>{status}</span>;
}

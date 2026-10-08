import type { Status } from "@/lib/engine";

const STYLES: Record<Status, string> = {
  "Over budget": "bg-destructive/15 text-destructive",
  "Ahead of plan": "bg-[#DDEBF7] text-[#1F4E79] dark:bg-[#1F3A52] dark:text-[#CFE3F5]",
  "Near limit": "bg-accent/25 text-accent-foreground dark:text-accent",
  Done: "bg-primary text-primary-foreground",
  "On track": "bg-secondary text-secondary-foreground",
  "Not started": "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>{status}</span>;
}

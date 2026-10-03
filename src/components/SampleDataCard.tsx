import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { categoriesQuery, friendlyError, transactionsQuery, useInvalidateData } from "@/lib/data";
import { seedSampleData } from "@/lib/sample-data";

/** First-run card: only shows while the user has no categories and no transactions. */
export function SampleDataCard() {
  const { data: cats, isLoading: l1 } = useQuery(categoriesQuery);
  const { data: txs, isLoading: l2 } = useQuery(transactionsQuery);
  const invalidate = useInvalidateData();
  const [busy, setBusy] = useState(false);
  if (l1 || l2 || (cats?.length ?? 0) > 0 || (txs?.length ?? 0) > 0) return null;

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mint text-mint-foreground">
          <Sparkles className="size-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg">New here? Try it with sample data</h2>
          <p className="text-sm text-muted-foreground">
            Adds a few categories, two accounts, income and this month's transactions so you can explore. You can delete them any time.
          </p>
        </div>
        <Button
          className="rounded-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await seedSampleData();
              toast.success("Sample data loaded");
            } catch (e) {
              toast.error(friendlyError(e));
            } finally {
              setBusy(false);
              invalidate();
            }
          }}
        >
          {busy ? "Loading…" : "Load sample data"}
        </Button>
      </div>
    </div>
  );
}

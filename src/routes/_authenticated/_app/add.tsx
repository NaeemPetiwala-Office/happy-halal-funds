import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { TransactionForm } from "@/components/TransactionForm";

export const Route = createFileRoute("/_authenticated/_app/add")({
  head: () => ({
    meta: [
      { title: "Add transaction — Halal Budget Planner" },
      { name: "description", content: "Log spending, income or a transfer in a few taps." },
      { property: "og:title", content: "Add transaction — Halal Budget Planner" },
      { property: "og:description", content: "Log spending, income or a transfer in a few taps." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader eyebrow="Quick entry" title="Add transaction" />
      <div className="relative mx-auto -mt-6 max-w-lg px-5">
        <div className="rounded-3xl border bg-card p-5 shadow-soft">
          <TransactionForm />
        </div>
      </div>
    </>
  );
}

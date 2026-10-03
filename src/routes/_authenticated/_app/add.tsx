import { createFileRoute } from "@tanstack/react-router";
import { PlusCircle } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

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
      <PlaceholderPage
        eyebrow="Quick entry"
        title="Add transaction"
        description="Log spending, income or a transfer in a few taps."
        icon={<PlusCircle className="size-6" />}
      />
    </>
  );
}

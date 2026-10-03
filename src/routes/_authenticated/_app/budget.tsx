import { createFileRoute } from "@tanstack/react-router";
import { PieChart } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/budget")({
  head: () => ({
    meta: [
      { title: "Budget — Halal Budget Planner" },
      { name: "description", content: "Plan income against categories and see carry-ins, remaining amounts and status." },
      { property: "og:title", content: "Budget — Halal Budget Planner" },
      { property: "og:description", content: "Plan income against categories and see carry-ins, remaining amounts and status." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="Plan"
        title="Budget"
        description="Plan income against categories and see carry-ins, remaining amounts and status."
        icon={<PieChart className="size-6" />}
      />
    </>
  );
}

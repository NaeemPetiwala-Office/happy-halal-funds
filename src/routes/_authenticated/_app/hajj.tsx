import { createFileRoute } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { PlannerPage } from "@/components/PlannerPage";

export const Route = createFileRoute("/_authenticated/_app/hajj")({
  head: () => ({
    meta: [
      { title: "Hajj & Umrah — Halal Budget Planner" },
      { name: "description", content: "Plan and save for Hajj or Umrah as a cash goal." },
      { property: "og:title", content: "Hajj & Umrah — Halal Budget Planner" },
      { property: "og:description", content: "Plan and save for Hajj or Umrah as a cash goal." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PlannerPage module="hajj" title="Hajj & Umrah" eyebrow="Optional planner" icon={<Plane className="size-6" />} suggestions={["Package", "Flights", "Visa", "Ihram & essentials", "Spending money"]} />;
}

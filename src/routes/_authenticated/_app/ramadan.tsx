import { createFileRoute } from "@tanstack/react-router";
import { Moon } from "lucide-react";
import { PlannerPage } from "@/components/PlannerPage";

export const Route = createFileRoute("/_authenticated/_app/ramadan")({
  head: () => ({
    meta: [
      { title: "Ramadan — Halal Budget Planner" },
      { name: "description", content: "Plan iftar, Eid and giving for the blessed month." },
      { property: "og:title", content: "Ramadan — Halal Budget Planner" },
      { property: "og:description", content: "Plan iftar, Eid and giving for the blessed month." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PlannerPage module="ramadan" title="Ramadan" eyebrow="Optional planner" icon={<Moon className="size-6" />} suggestions={["Iftar & suhoor", "Eid clothes", "Eid gifts", "Zakat al-Fitr", "Sadaqah"]} />;
}

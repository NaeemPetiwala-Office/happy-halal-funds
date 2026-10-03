import { createFileRoute } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { PlannerPage } from "@/components/PlannerPage";

export const Route = createFileRoute("/_authenticated/_app/qurbani")({
  head: () => ({
    meta: [
      { title: "Qurbani — Halal Budget Planner" },
      { name: "description", content: "Save towards your Qurbani share ahead of Eid al-Adha." },
      { property: "og:title", content: "Qurbani — Halal Budget Planner" },
      { property: "og:description", content: "Save towards your Qurbani share ahead of Eid al-Adha." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PlannerPage module="qurbani" title="Qurbani" eyebrow="Optional planner" icon={<Gift className="size-6" />} suggestions={["Qurbani share", "Eid clothes", "Eid gifts", "Hosting family"]} />;
}

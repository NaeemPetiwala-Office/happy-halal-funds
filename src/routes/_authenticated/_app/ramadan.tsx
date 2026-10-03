import { createFileRoute } from "@tanstack/react-router";
import { Moon } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

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
  return (
    <>
      <PlaceholderPage
        eyebrow="Optional planner"
        title="Ramadan"
        description="Plan iftar, Eid and giving for the blessed month."
        icon={<Moon className="size-6" />}
      />
    </>
  );
}

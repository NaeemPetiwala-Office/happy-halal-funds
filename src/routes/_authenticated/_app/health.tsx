import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/health")({
  head: () => ({
    meta: [
      { title: "Health check — Halal Budget Planner" },
      { name: "description", content: "Spot and fix mistakes in your plan before they show wrong numbers." },
      { property: "og:title", content: "Health check — Halal Budget Planner" },
      { property: "og:description", content: "Spot and fix mistakes in your plan before they show wrong numbers." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="Checks"
        title="Health check"
        description="Spot and fix mistakes in your plan before they show wrong numbers."
        icon={<HeartPulse className="size-6" />}
      />
    </>
  );
}

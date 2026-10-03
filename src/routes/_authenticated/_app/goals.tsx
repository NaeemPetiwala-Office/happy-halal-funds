import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/goals")({
  head: () => ({
    meta: [
      { title: "Goals — Halal Budget Planner" },
      { name: "description", content: "Cash goals for big purchases, with progress and estimated completion." },
      { property: "og:title", content: "Goals — Halal Budget Planner" },
      { property: "og:description", content: "Cash goals for big purchases, with progress and estimated completion." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="Saving up"
        title="Goals"
        description="Cash goals for big purchases, with progress and estimated completion."
        icon={<Target className="size-6" />}
      />
    </>
  );
}

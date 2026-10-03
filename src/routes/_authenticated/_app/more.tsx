import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/more")({
  head: () => ({
    meta: [
      { title: "More — Halal Budget Planner" },
      { name: "description", content: "Goals, accounts, recurring payments, Zakat, interest purification and optional planners." },
      { property: "og:title", content: "More — Halal Budget Planner" },
      { property: "og:description", content: "Goals, accounts, recurring payments, Zakat, interest purification and optional planners." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="Everything else"
        title="More"
        description="Goals, accounts, recurring payments, Zakat, interest purification and optional planners."
        icon={<MoreHorizontal className="size-6" />}
      />
    </>
  );
}

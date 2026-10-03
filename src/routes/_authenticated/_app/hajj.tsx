import { createFileRoute } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

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
  return (
    <>
      <PlaceholderPage
        eyebrow="Optional planner"
        title="Hajj & Umrah"
        description="Plan and save for Hajj or Umrah as a cash goal."
        icon={<Plane className="size-6" />}
      />
    </>
  );
}

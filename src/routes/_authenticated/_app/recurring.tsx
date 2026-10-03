import { createFileRoute } from "@tanstack/react-router";
import { Repeat } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/recurring")({
  head: () => ({
    meta: [
      { title: "Recurring — Halal Budget Planner" },
      { name: "description", content: "Bills that repeat monthly, quarterly or yearly, with monthly set-aside amounts." },
      { property: "og:title", content: "Recurring — Halal Budget Planner" },
      { property: "og:description", content: "Bills that repeat monthly, quarterly or yearly, with monthly set-aside amounts." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="Regular payments"
        title="Recurring"
        description="Bills that repeat monthly, quarterly or yearly, with monthly set-aside amounts."
        icon={<Repeat className="size-6" />}
      />
    </>
  );
}

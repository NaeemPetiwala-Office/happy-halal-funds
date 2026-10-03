import { createFileRoute } from "@tanstack/react-router";
import { ListOrdered } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/log")({
  head: () => ({
    meta: [
      { title: "Transaction log — Halal Budget Planner" },
      { name: "description", content: "Every transaction and income entry, searchable and filterable by month." },
      { property: "og:title", content: "Transaction log — Halal Budget Planner" },
      { property: "og:description", content: "Every transaction and income entry, searchable and filterable by month." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="History"
        title="Transaction log"
        description="Every transaction and income entry, searchable and filterable by month."
        icon={<ListOrdered className="size-6" />}
      />
    </>
  );
}

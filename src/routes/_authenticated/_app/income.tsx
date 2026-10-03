import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/income")({
  head: () => ({
    meta: [
      { title: "Income — Halal Budget Planner" },
      { name: "description", content: "Income sources and the entries you receive each month." },
      { property: "og:title", content: "Income — Halal Budget Planner" },
      { property: "og:description", content: "Income sources and the entries you receive each month." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="Money in"
        title="Income"
        description="Income sources and the entries you receive each month."
        icon={<Wallet className="size-6" />}
      />
    </>
  );
}

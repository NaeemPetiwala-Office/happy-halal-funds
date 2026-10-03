import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";
import { SampleDataCard } from "@/components/SampleDataCard";

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Halal Budget Planner" },
      { name: "description", content: "Your month at a glance: income received, spending, leftovers and what needs attention." },
      { property: "og:title", content: "Dashboard — Halal Budget Planner" },
      { property: "og:description", content: "Your month at a glance: income received, spending, leftovers and what needs attention." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <div className="mx-auto max-w-5xl px-5 pt-6 md:px-16"><SampleDataCard /></div>
      <PlaceholderPage
        eyebrow="Overview"
        title="Dashboard"
        description="Your month at a glance: income received, spending, leftovers and what needs attention."
        icon={<LayoutDashboard className="size-6" />}
      />
    </>
  );
}

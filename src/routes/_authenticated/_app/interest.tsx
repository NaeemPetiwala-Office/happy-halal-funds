import { createFileRoute } from "@tanstack/react-router";
import { Scale } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/interest")({
  head: () => ({
    meta: [
      { title: "Interest — Halal Budget Planner" },
      { name: "description", content: "Track interest received and given away so nothing is kept by mistake." },
      { property: "og:title", content: "Interest — Halal Budget Planner" },
      { property: "og:description", content: "Track interest received and given away so nothing is kept by mistake." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="Purification"
        title="Interest"
        description="Track interest received and given away so nothing is kept by mistake."
        icon={<Scale className="size-6" />}
      />
      <p className="mx-auto mt-4 max-w-5xl px-5 text-center text-xs text-muted-foreground md:px-16">
        This is a budgeting aid, not religious or financial advice. Please consult a qualified scholar.
      </p>
    </>
  );
}

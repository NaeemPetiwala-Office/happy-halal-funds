import { createFileRoute } from "@tanstack/react-router";
import { HandCoins } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/zakat")({
  head: () => ({
    meta: [
      { title: "Zakat — Halal Budget Planner" },
      { name: "description", content: "Estimate Zakat from your assets and the nisab you choose. A budgeting aid, not religious advice." },
      { property: "og:title", content: "Zakat — Halal Budget Planner" },
      { property: "og:description", content: "Estimate Zakat from your assets and the nisab you choose. A budgeting aid, not religious advice." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="Purify your wealth"
        title="Zakat"
        description="Estimate Zakat from your assets and the nisab you choose. A budgeting aid, not religious advice."
        icon={<HandCoins className="size-6" />}
      />
      <p className="mx-auto mt-4 max-w-5xl px-5 text-center text-xs text-muted-foreground md:px-16">
        This is a budgeting aid, not religious or financial advice. Please consult a qualified scholar.
      </p>
    </>
  );
}

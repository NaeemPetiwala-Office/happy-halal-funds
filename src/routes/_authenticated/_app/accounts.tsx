import { createFileRoute } from "@tanstack/react-router";
import { Landmark } from "lucide-react";
import { PlaceholderPage } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/_app/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — Halal Budget Planner" },
      { name: "description", content: "Account balances, minimums and transfers between accounts." },
      { property: "og:title", content: "Accounts — Halal Budget Planner" },
      { property: "og:description", content: "Account balances, minimums and transfers between accounts." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <PlaceholderPage
        eyebrow="Where money lives"
        title="Accounts"
        description="Account balances, minimums and transfers between accounts."
        icon={<Landmark className="size-6" />}
      />
    </>
  );
}

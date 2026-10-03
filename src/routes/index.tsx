import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Halal Budget Planner" },
      {
        name: "description",
        content:
          "Plan your finances with confidence — a budgeting companion built around halal principles.",
      },
      { property: "og:title", content: "Halal Budget Planner" },
      {
        property: "og:description",
        content:
          "Plan your finances with confidence — a budgeting companion built around halal principles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex flex-col items-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="h-12 w-12 text-primary"
          fill="none"
        >
          <path
            d="M24 4 L30 18 L44 24 L30 30 L24 44 L18 30 L4 24 L18 18 Z"
            fill="currentColor"
            opacity="0.9"
          />
          <circle cx="24" cy="24" r="5" fill="var(--color-background)" />
        </svg>

        <h1 className="mt-8 font-display text-5xl font-normal tracking-tight text-foreground sm:text-6xl">
          Halal Budget Planner
        </h1>

        <div className="mt-6 h-px w-16 bg-primary/40" aria-hidden="true" />

        <p className="mt-6 max-w-md text-balance font-sans text-base leading-relaxed text-muted-foreground sm:text-lg">
          Welcome. A calm, principled way to plan your money — coming soon.
        </p>
      </div>
    </main>
  );
}

import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { profileQuery } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/_app")({
  beforeLoad: async ({ context }) => {
    const profile = await context.queryClient.ensureQueryData(profileQuery);
    if (!profile?.onboarding_completed) throw redirect({ to: "/onboarding" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

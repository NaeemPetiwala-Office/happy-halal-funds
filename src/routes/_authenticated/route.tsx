import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Offline: trust the session stored on this device so cached screens stay readable.
    // Nothing can be fetched or written offline, and the server re-validates once back online.
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) return { user: data.session.user };
    }
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});

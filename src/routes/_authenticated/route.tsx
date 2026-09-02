import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendWelcomeEmail } from "@/utils/notifications.functions";

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();

  useEffect(() => {
    if (!user?.id) return;
    const key = `deposit:welcome-sent:${user.id}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    // Server-side idempotency key prevents duplicate sends across devices.
    void sendWelcomeEmail({ data: undefined }).catch(() => {});
  }, [user?.id]);

  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

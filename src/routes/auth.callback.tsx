import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { consumeOAuthRedirect } from "@/lib/oauth-callback";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site-shell";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signing you in — deposit" },
      { name: "description", content: "Completing your deposit sign-in." },
      { property: "og:title", content: "Signing you in — deposit" },
      { property: "og:description", content: "Completing your deposit sign-in." },
    ],
  }),
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await consumeOAuthRedirect();
      if (cancelled) return;
      if (result.status === "error") {
        toast.error(result.message);
        navigate({ to: "/auth", replace: true });
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        const dest = sessionStorage.getItem("deposit:after-auth");
        sessionStorage.removeItem("deposit:after-auth");
        window.location.replace(dest && dest.startsWith("/") ? dest : "/dashboard");
      } else {
        navigate({ to: "/auth", replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5">
      <div className="aurora pointer-events-none absolute inset-0 -z-10 opacity-80" />
      <div className="glass-panel flex flex-col items-center gap-4 px-10 py-12 text-center">
        <Logo />
        <p className="text-sm text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}

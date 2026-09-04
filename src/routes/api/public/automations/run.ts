import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Scheduled tenant email automations (first-scan nudges, unsealed-report
 * reminders, move-out deadline reminders). Cron-authenticated.
 */
export const Route = createFileRoute("/api/public/automations/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        try {
          const { runEmailAutomations } = await import("@/lib/automations.server");
          const result = await runEmailAutomations();
          return Response.json(result, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Automation run failed";
          console.error(`Automation run failed: ${message}`);
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error("Unable to verify permissions");
  if (!data) throw new Error("Forbidden");
}

export type AutomationRunSummary = {
  ran_at: string;
  sent: Record<string, number>;
  skipped: number;
  errors: string[];
};

/** Admin-triggered run of the scheduled tenant emails. */
export const runAutomationsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AutomationRunSummary> => {
    await assertAdmin(context.supabase, context.userId);
    const { runEmailAutomations } = await import("@/lib/automations.server");
    return await runEmailAutomations();
  });

/** Recent automation sends, newest first. */
export const listAutomationSends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ automation: string; email: string | null; sent_at: string }[]> => {
      await assertAdmin(context.supabase, context.userId);
      const { data } = await context.supabase
        .from("email_automation_sends")
        .select("automation, email, sent_at")
        .order("sent_at", { ascending: false })
        .limit(25);
      return (data ?? []) as { automation: string; email: string | null; sent_at: string }[];
    },
  );

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APP_URL = "https://www.myazdepositportal.live";

/** Sends the one-time welcome email to the signed-in user. */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name, notify_email")
      .eq("id", context.userId)
      .maybeSingle();

    const email = profile?.email ?? (context.claims as { email?: string } | null)?.email;
    if (!email) return { sent: false as const };
    if (profile && profile.notify_email === false) return { sent: false as const };

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .limit(1);

    try {
      const result = await sendTemplateEmail("welcome", email, {
        templateData: {
          name: profile?.full_name || null,
          role: roles?.[0]?.role ?? "tenant",
          appUrl: APP_URL,
        },
        idempotencyKey: `welcome-${context.userId}`,
      });
      return { sent: result.sent };
    } catch (error) {
      console.error("welcome email failed", error);
      return { sent: false as const };
    }
  });

/** Sends the "report sealed" confirmation to the report's owner. */
export const sendReportReadyEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { reportId: string }) => {
    const reportId = (input.reportId ?? "").trim();
    if (!reportId) throw new Error("Missing report id.");
    return { reportId };
  })
  .handler(async ({ data, context }) => {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // RLS-scoped read proves the caller owns this report.
    const { data: report } = await context.supabase
      .from("reports")
      .select("id, report_number, type, overall_hash, property_id")
      .eq("id", data.reportId)
      .maybeSingle();
    if (!report) return { sent: false as const };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, notify_email")
      .eq("id", context.userId)
      .maybeSingle();
    const email = profile?.email ?? (context.claims as { email?: string } | null)?.email;
    if (!email || profile?.notify_email === false) return { sent: false as const };

    let address: string | null = null;
    if (report.property_id) {
      const { data: property } = await context.supabase
        .from("properties")
        .select("address, unit")
        .eq("id", report.property_id)
        .maybeSingle();
      if (property) address = [property.address, property.unit].filter(Boolean).join(", ");
    }

    const { count } = await context.supabase
      .from("media")
      .select("id", { count: "exact", head: true })
      .eq("report_id", report.id);

    try {
      const result = await sendTemplateEmail("report-ready", email, {
        templateData: {
          reportNumber: report.report_number,
          reportType: report.type === "move_out" ? "Move-out" : "Move-in",
          address,
          photoCount: count ?? undefined,
          hash: report.overall_hash,
          reportId: report.id,
          appUrl: APP_URL,
        },
        idempotencyKey: `report-ready-${report.id}`,
      });
      return { sent: result.sent };
    } catch (error) {
      console.error("report ready email failed", error);
      return { sent: false as const };
    }
  });

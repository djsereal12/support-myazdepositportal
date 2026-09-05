import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const APP_URL = "https://www.myazdepositportal.live";

/**
 * Notifies the tenant who owns a report that their landlord responded.
 * Never throws into the caller's flow — a failed notification must not fail
 * the landlord's action.
 */
export async function notifyTenantOfLandlordResponse(opts: {
  inviteId: string;
  reportId: string;
  tenantUserId: string;
  event: "accepted" | "disputed" | "replied";
  landlordName?: string | null;
  note?: string | null;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profile }, { data: report }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("email, notify_email")
        .eq("id", opts.tenantUserId)
        .maybeSingle(),
      supabaseAdmin
        .from("reports")
        .select("report_number, property_id")
        .eq("id", opts.reportId)
        .maybeSingle(),
    ]);

    const email = profile?.email;
    if (!email) return;
    if (profile && "notify_email" in profile && profile.notify_email === false) return;

    let address: string | null = null;
    if (report?.property_id) {
      const { data: property } = await supabaseAdmin
        .from("properties")
        .select("address, unit")
        .eq("id", report.property_id)
        .maybeSingle();
      if (property) address = [property.address, property.unit].filter(Boolean).join(", ");
    }

    await sendTemplateEmail("landlord-response", email, {
      templateData: {
        event: opts.event,
        reportNumber: report?.report_number ?? null,
        address,
        landlordName: opts.landlordName ?? null,
        note: opts.note ?? null,
        reportId: opts.reportId,
        appUrl: APP_URL,
      },
      idempotencyKey: `landlord-response-${opts.event}-${opts.inviteId}-${Date.now()}`,
    });
  } catch (error) {
    console.error("landlord response notification failed", error);
  }
}

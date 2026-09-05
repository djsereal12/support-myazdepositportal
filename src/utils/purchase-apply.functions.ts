import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const REPORT_UNLOCK_PRICES = [
  "single_report_onetime",
  "protection_bundle_onetime",
  "certified_pdf_onetime",
];

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${crypto.randomUUID().replace(/-/g, "")}${rand}`.slice(0, 56);
}

export type ApplyResult = {
  applied: number;
  reportNumber: string | null;
  reportId: string | null;
  address: string | null;
  landlordEmail: string | null;
  landlordEmailSent: boolean;
  message: string;
};

/**
 * After a pricing-page payment, attach the buyer's unassigned paid purchases to
 * their most recent scan report and, when the report is sealed and the property
 * has a landlord email, send the landlord the review link automatically.
 */
export const applyPurchaseToNextReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { origin?: string }) => ({
    origin: (input?.origin ?? "https://www.myazdepositportal.live").replace(/\/$/, ""),
  }))
  .handler(async ({ data, context }): Promise<ApplyResult> => {
    const { supabase, userId } = context;
    const empty: ApplyResult = {
      applied: 0,
      reportNumber: null,
      reportId: null,
      address: null,
      landlordEmail: null,
      landlordEmailSent: false,
      message: "No new purchase needed to be applied.",
    };

    const { data: purchases } = await supabase
      .from("purchases")
      .select("id, price_id, report_id, property_id, created_at")
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    const paid = purchases ?? [];
    const floating = paid.filter(
      (p) => !p.report_id && REPORT_UNLOCK_PRICES.includes(p.price_id ?? ""),
    );
    if (!floating.length) return empty;

    const { data: reports } = await supabase
      .from("reports")
      .select("id, report_number, property_id, overall_hash, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const alreadyUnlocked = new Set(paid.map((p) => p.report_id).filter(Boolean) as string[]);
    const candidates = (reports ?? []).filter((r) => !alreadyUnlocked.has(r.id));
    const target = candidates.find((r) => r.overall_hash) ?? candidates[0];
    if (!target) {
      return {
        ...empty,
        message: "Your purchase is saved and will unlock the next report you create.",
      };
    }

    const purchase = floating[0]!;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: updateError } = await supabaseAdmin
      .from("purchases")
      .update({
        report_id: target.id,
        property_id: target.property_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", purchase.id)
      .eq("user_id", userId);
    if (updateError) throw new Error(updateError.message);

    const { data: property } = await supabase
      .from("properties")
      .select("address, unit, landlord_email, landlord_name")
      .eq("id", target.property_id)
      .maybeSingle();

    const address = property
      ? `${property.address}${property.unit ? ` ${property.unit}` : ""}`
      : null;
    const landlordEmail = (property?.landlord_email ?? "").trim().toLowerCase() || null;

    const base: ApplyResult = {
      applied: 1,
      reportNumber: target.report_number,
      reportId: target.id,
      address,
      landlordEmail,
      landlordEmailSent: false,
      message: `Report ${target.report_number} is unlocked.`,
    };

    if (!target.overall_hash) {
      return {
        ...base,
        message: `Report ${target.report_number} is unlocked. Seal it to send it to your landlord.`,
      };
    }
    if (!landlordEmail) {
      return {
        ...base,
        message: `Report ${target.report_number} is unlocked. Add your landlord's email to send it.`,
      };
    }

    // Reuse an existing pending request for this report instead of spamming.
    const { data: existing } = await supabase
      .from("landlord_invites")
      .select("id, token, status")
      .eq("report_id", target.id)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let inviteId = existing?.id ?? null;
    let token = existing?.token ?? null;

    if (!inviteId) {
      const { data: invite, error: inviteError } = await supabase
        .from("landlord_invites")
        .insert({
          report_id: target.id,
          property_id: target.property_id,
          user_id: userId,
          landlord_email: landlordEmail,
          landlord_name: property?.landlord_name ?? null,
          custom_message:
            "Please review the sealed condition report for this unit and accept it or add your notes.",
          token: randomToken(),
        })
        .select("id, token")
        .single();
      if (inviteError || !invite) return base;
      inviteId = invite.id;
      token = invite.token;

      await supabase.from("report_shares").insert({
        report_id: target.id,
        property_id: target.property_id,
        user_id: userId,
        landlord_email: landlordEmail,
      });
    }

    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const result = await sendTemplateEmail("landlord-invite", landlordEmail, {
        templateData: {
          address: address ?? "your rental",
          reportNumber: target.report_number,
          customMessage:
            "This sealed condition report was documented with photo fingerprints, GPS and timestamps.",
          link: `${data.origin}/verify/${token}`,
        },
        idempotencyKey: `landlord-invite-${inviteId}`,
      });
      return {
        ...base,
        landlordEmailSent: result.sent,
        message: result.sent
          ? `Report ${target.report_number} is unlocked and sent to ${landlordEmail}.`
          : `Report ${target.report_number} is unlocked. The landlord email could not be delivered.`,
      };
    } catch (error) {
      console.error("auto landlord send failed", error);
      return base;
    }
  });

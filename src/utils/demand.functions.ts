import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const APP_URL = "https://myazdepositportal.live";

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/**
 * Saves the demand letter to the tenant's file and emails it to the landlord
 * from the app's verified domain, with the sealed report number and SHA-256
 * seal included plus a public verification link.
 */
export const sendDemandLetter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      propertyId: string;
      body: string;
      amountWithheld: number;
      deadline?: string;
      landlordEmail?: string;
      tenantName?: string;
    }) => {
      const propertyId = (input.propertyId ?? "").trim();
      if (!propertyId) throw new Error("Missing property.");
      const body = (input.body ?? "").trim();
      if (body.length < 40) throw new Error("The letter is empty.");
      const email = (input.landlordEmail ?? "").trim().toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Enter a valid landlord email.");
      return {
        propertyId,
        body: body.slice(0, 20000),
        amountWithheld: Number.isFinite(input.amountWithheld) ? Number(input.amountWithheld) : 0,
        deadline: (input.deadline ?? "").slice(0, 40),
        landlordEmail: email,
        tenantName: (input.tenantName ?? "").trim().slice(0, 120),
      };
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // RLS-scoped read proves the caller owns this property.
    const { data: property } = await supabase
      .from("properties")
      .select("id, address, unit, landlord_email, landlord_name, deposit_amount")
      .eq("id", data.propertyId)
      .maybeSingle();
    if (!property) throw new Error("Property not found.");

    const to = data.landlordEmail || (property.landlord_email ?? "").toLowerCase();
    if (!to) throw new Error("Add the landlord's email to this property first.");

    // Paid gate: the $29 demand letter must be unlocked for this property.
    const { data: paid } = await supabase
      .from("purchases")
      .select("price_id, property_id, created_at")
      .eq("status", "paid");
    const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const unlocked = (paid ?? []).some(
      (p) =>
        (p.price_id === "demand_letter_onetime" && p.property_id === property.id) ||
        (p.price_id === "landlord_unlimited_yearly" && new Date(p.created_at).getTime() > yearAgo),
    );
    if (!unlocked) throw new Error("Unlock the demand letter ($29) before sending it.");

    // Newest sealed move-out report for this property carries the evidence seal.
    const { data: report } = await supabase
      .from("reports")
      .select("id, report_number, overall_hash, created_at")
      .eq("property_id", property.id)
      .not("overall_hash", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: letter, error: insertError } = await supabase
      .from("demand_letters")
      .insert({
        property_id: property.id,
        report_id: report?.id ?? null,
        user_id: userId,
        amount_withheld: data.amountWithheld,
        body: data.body,
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    // Give the landlord read access to the sealed report they are being asked about.
    if (report?.id) {
      await supabase.from("report_shares").insert({
        report_id: report.id,
        property_id: property.id,
        user_id: userId,
        landlord_email: to,
      });
    }

    const address = `${property.address}${property.unit ? ` ${property.unit}` : ""}`;
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    try {
      const result = await sendTemplateEmail("demand-letter", to, {
        templateData: {
          address,
          tenantName: data.tenantName || profile?.full_name || null,
          amountWithheld: money(data.amountWithheld),
          deadline: data.deadline || null,
          letterBody: data.body,
          reportNumber: report?.report_number ?? null,
          hash: report?.overall_hash ?? null,
          verifyLink: report?.id ? `${APP_URL}/verify/${report.id}` : null,
        },
        idempotencyKey: `demand-letter-${letter.id}`,
        ...(profile?.email ? { replyTo: profile.email } : {}),
      });
      return { sent: result.sent, to, letterId: letter.id, reportNumber: report?.report_number ?? null };
    } catch (error) {
      console.error("demand letter email failed", error);
      throw new Error("The letter was saved, but the email could not be delivered right now.");
    }
  });

import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InviteMedia = {
  id: string;
  room_label: string;
  condition: string;
  note: string | null;
  file_hash_sha256: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  exif_timestamp: string | null;
  created_at: string;
  url: string | null;
  is_video: boolean;
};

export type InviteView = {
  status: string;
  landlord_name: string | null;
  landlord_email: string;
  custom_message: string | null;
  sent_at: string;
  expires_at: string;
  responded_at: string | null;
  response_signature_name: string | null;
  response_note: string | null;
  report: {
    id: string;
    report_number: string;
    type: string;
    created_at: string;
    overall_hash: string | null;
    weather_snapshot: string | null;
    gps_lat: number | null;
    gps_lng: number | null;
  };
  property: {
    address: string;
    unit: string | null;
    lease_start: string | null;
    landlord_name: string | null;
  } | null;
  tenant_name: string | null;
  media: InviteMedia[];
};

function randomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const rand = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${crypto.randomUUID().replace(/-/g, "")}${rand}`.slice(0, 56);
}

async function sendInviteEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["RESEND_FROM_EMAIL"] ?? "deposit <onboarding@resend.dev>";
  if (!apiKey) return { sent: false, reason: "no_email_provider" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [args.to], subject: args.subject, html: args.html, text: args.text }),
    });
    if (!res.ok) return { sent: false, reason: `provider_error_${res.status}` };
    return { sent: true };
  } catch {
    return { sent: false, reason: "provider_unreachable" };
  }
}

/** Tenant-only: create an e-sign invite for a move-in report and email the landlord. */
export const createLandlordInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    reportId: string;
    landlordEmail: string;
    landlordName?: string;
    customMessage?: string;
    origin: string;
  }) => {
    const email = input.landlordEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid landlord email.");
    if (!input.reportId) throw new Error("Missing report.");
    return {
      reportId: input.reportId,
      landlordEmail: email,
      landlordName: (input.landlordName ?? "").trim().slice(0, 120),
      customMessage: (input.customMessage ?? "").trim().slice(0, 2000),
      origin: input.origin.replace(/\/$/, ""),
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: report, error } = await supabase
      .from("reports")
      .select("id, report_number, type, property_id, properties(address, unit)")
      .eq("id", data.reportId)
      .single();
    if (error || !report) throw new Error("Report not found.");

    const property = report.properties as unknown as { address: string; unit: string | null } | null;
    const token = randomToken();

    const { data: invite, error: insertError } = await supabase
      .from("landlord_invites")
      .insert({
        report_id: report.id,
        property_id: report.property_id,
        user_id: userId,
        landlord_email: data.landlordEmail,
        landlord_name: data.landlordName || null,
        custom_message: data.customMessage || null,
        token,
      })
      .select("id, token, expires_at")
      .single();
    if (insertError || !invite) throw new Error(insertError?.message ?? "Could not create the request.");

    const address = `${property?.address ?? "your rental"}${property?.unit ? ` ${property.unit}` : ""}`;
    const link = `${data.origin}/verify/${invite.token}`;
    const subject = `Action Required: Review Move-In Report for ${address}`;
    const text = [
      `A tenant completed move-in documentation per A.R.S. § 33-1321(C).`,
      "",
      data.customMessage,
      "",
      `View report: ${link}`,
      "",
      "This link expires in 7 days. Please Accept if accurate or Dispute with notes.",
      `Report number: ${report.report_number}`,
    ]
      .filter(Boolean)
      .join("\n");
    const html = `
      <div style="font-family:Inter,Helvetica,Arial,sans-serif;color:#111111;background:#F8F7F5;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #EAE9E5;border-radius:16px;padding:32px">
          <p style="font-size:22px;margin:0 0 20px">deposit</p>
          <h1 style="font-size:20px;margin:0 0 16px">Review the move-in inspection for ${address}</h1>
          <p style="font-size:14px;line-height:1.6;margin:0 0 16px">${(data.customMessage || "Please review and accept the attached move-in inspection report.").replace(/</g, "&lt;")}</p>
          <p style="font-size:14px;line-height:1.6;margin:0 0 24px">Report ${report.report_number}, created per A.R.S. § 33-1321(C). Photos include GPS, timestamps and SHA-256 hashes.</p>
          <a href="${link}" style="display:inline-block;background:#111111;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">View &amp; e-sign the report</a>
          <p style="font-size:12px;color:#6b675f;margin:24px 0 0">This link expires in 7 days. You can accept the report or dispute it with notes — no account required.</p>
        </div>
      </div>`;

    const result = await sendInviteEmail({ to: data.landlordEmail, subject, html, text });
    return { inviteId: invite.id, token: invite.token, link, subject, text, emailSent: result.sent, reason: result.reason ?? null };
  });

/** Public: load an invite and its full report by token. */
export const getInviteByToken = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: (input.token ?? "").trim() }))
  .handler(async ({ data }): Promise<{ ok: false; reason: "not_found" | "expired" } | { ok: true; invite: InviteView }> => {
    if (!data.token) return { ok: false, reason: "not_found" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invite } = await supabaseAdmin
      .from("landlord_invites")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) return { ok: false, reason: "not_found" };
    if (new Date(invite.expires_at).getTime() < Date.now() && invite.status === "pending") {
      return { ok: false, reason: "expired" };
    }

    const { data: report } = await supabaseAdmin
      .from("reports")
      .select("id, report_number, type, created_at, overall_hash, weather_snapshot, gps_lat, gps_lng, user_id, properties(address, unit, lease_start, landlord_name)")
      .eq("id", invite.report_id)
      .maybeSingle();
    if (!report) return { ok: false, reason: "not_found" };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", report.user_id)
      .maybeSingle();

    const { data: media } = await supabaseAdmin
      .from("media")
      .select("id, room_label, condition, note, file_url, file_hash_sha256, gps_lat, gps_lng, exif_timestamp, created_at")
      .eq("report_id", invite.report_id)
      .order("created_at");

    const withUrls: InviteMedia[] = [];
    for (const m of media ?? []) {
      const { data: signed } = await supabaseAdmin.storage
        .from("media")
        .createSignedUrl(m.file_url, 60 * 60 * 2);
      withUrls.push({
        id: m.id,
        room_label: m.room_label,
        condition: m.condition,
        note: m.note,
        file_hash_sha256: m.file_hash_sha256,
        gps_lat: m.gps_lat,
        gps_lng: m.gps_lng,
        exif_timestamp: m.exif_timestamp,
        created_at: m.created_at,
        url: signed?.signedUrl ?? null,
        is_video: /\.(mp4|mov|webm|m4v)$/i.test(m.file_url),
      });
    }

    const property = report.properties as unknown as InviteView["property"];

    return {
      ok: true,
      invite: {
        status: invite.status,
        landlord_name: invite.landlord_name,
        landlord_email: invite.landlord_email,
        custom_message: invite.custom_message,
        sent_at: invite.sent_at,
        expires_at: invite.expires_at,
        responded_at: invite.responded_at,
        response_signature_name: invite.response_signature_name,
        response_note: invite.response_note,
        report: {
          id: report.id,
          report_number: report.report_number,
          type: report.type,
          created_at: report.created_at,
          overall_hash: report.overall_hash,
          weather_snapshot: report.weather_snapshot,
          gps_lat: report.gps_lat,
          gps_lng: report.gps_lng,
        },
        property,
        tenant_name: profile?.full_name ?? null,
        media: withUrls,
      },
    };
  });

/** Public: landlord accepts (e-signs) or disputes the report. */
export const respondToInvite = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; action: "accepted" | "disputed"; signatureName?: string; note?: string }) => {
    const token = (input.token ?? "").trim();
    if (!token) throw new Error("Missing link token.");
    if (input.action !== "accepted" && input.action !== "disputed") throw new Error("Invalid action.");
    const signatureName = (input.signatureName ?? "").trim().slice(0, 120);
    const note = (input.note ?? "").trim().slice(0, 2000);
    if (input.action === "accepted" && signatureName.length < 2) {
      throw new Error("Type your full legal name to e-sign.");
    }
    if (input.action === "disputed" && note.length < 5) {
      throw new Error("Add a note describing the dispute.");
    }
    return { token, action: input.action, signatureName, note };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: invite } = await supabaseAdmin
      .from("landlord_invites")
      .select("id, status, expires_at, report_id, property_id, user_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) throw new Error("This link is no longer valid.");
    if (invite.status !== "pending") throw new Error("This report has already received a response.");
    if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error("This link has expired.");

    let ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? null;
    if (!ip) {
      try {
        ip = (getRequest() as unknown as { headers: Headers }).headers.get("x-real-ip");
      } catch {
        ip = null;
      }
    }
    if (ip) ip = ip.split(",")[0]!.trim().slice(0, 64);

    const { error } = await supabaseAdmin
      .from("landlord_invites")
      .update({
        status: data.action,
        responded_at: new Date().toISOString(),
        response_ip: ip,
        response_signature_name: data.action === "accepted" ? data.signatureName : null,
        response_note: data.note || null,
      })
      .eq("id", invite.id);
    if (error) throw new Error(error.message);

    if (data.action === "disputed") {
      await supabaseAdmin.from("disputes").insert({
        report_id: invite.report_id,
        property_id: invite.property_id,
        landlord_id: invite.user_id,
        amount_claimed: 0,
        reason: `Move-in report disputed via e-sign link: ${data.note}`,
        status: "open",
      });
    }

    return { status: data.action };
  });

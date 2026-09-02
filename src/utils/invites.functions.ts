import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
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
  address: string;
  reportNumber: string;
  customMessage: string;
  link: string;
  inviteId: string;
}): Promise<{ sent: boolean; reason?: string }> {
  try {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const result = await sendTemplateEmail("landlord-invite", args.to, {
      templateData: {
        address: args.address,
        reportNumber: args.reportNumber,
        customMessage: args.customMessage,
        link: args.link,
      },
      idempotencyKey: `landlord-invite-${args.inviteId}`,
    });
    if (result.sent) return { sent: true };
    return { sent: false, reason: result.reason ?? "not_sent" };
  } catch (err) {
    console.error("landlord invite email failed", err);
    return { sent: false, reason: "provider_error" };
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

    const result = await sendInviteEmail({
      to: data.landlordEmail,
      address,
      reportNumber: report.report_number,
      customMessage: data.customMessage,
      link,
      inviteId: invite.id,
    });
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
    if (invite.status === "accepted") throw new Error("This report has already been accepted.");
    if (invite.status === "disputed" && data.action === "disputed") {
      throw new Error("This report is already disputed. Add a reply instead.");
    }
    if (invite.status === "pending" && new Date(invite.expires_at).getTime() < Date.now()) {
      throw new Error("This link has expired.");
    }

    const rawIp =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for") ??
      getRequestHeader("x-real-ip") ??
      null;
    const ip = rawIp ? rawIp.split(",")[0]!.trim().slice(0, 64) : null;

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

    const { notifyTenantOfLandlordResponse } = await import("@/lib/notify.server");
    await notifyTenantOfLandlordResponse({
      inviteId: invite.id,
      reportId: invite.report_id,
      tenantUserId: invite.user_id,
      event: data.action,
      note: data.action === "disputed" ? data.note : data.signatureName,
    });

    return { status: data.action };
  });


export type PortalInvite = {
  token: string;
  status: string;
  sent_at: string;
  expires_at: string;
  responded_at: string | null;
  response_note: string | null;
  response_signature_name: string | null;
  report_number: string;
  report_type: string;
  report_created_at: string;
  overall_hash: string | null;
  address: string;
  unit: string | null;
  tenant_name: string | null;
  messages: { id: string; author_role: string; author_name: string | null; body: string; created_at: string }[];
};

/** Public: with any valid invite token, load every request sent to that landlord email. */
export const getLandlordPortal = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: (input.token ?? "").trim() }))
  .handler(async ({ data }): Promise<
    { ok: false; reason: "not_found" } | { ok: true; landlordEmail: string; invites: PortalInvite[] }
  > => {
    if (!data.token) return { ok: false, reason: "not_found" };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: seed } = await supabaseAdmin
      .from("landlord_invites")
      .select("landlord_email")
      .eq("token", data.token)
      .maybeSingle();
    if (!seed) return { ok: false, reason: "not_found" };

    const { data: invites } = await supabaseAdmin
      .from("landlord_invites")
      .select(
        "id, token, status, sent_at, expires_at, responded_at, response_note, response_signature_name, report_id, reports(report_number, type, created_at, overall_hash, user_id, properties(address, unit))",
      )
      .eq("landlord_email", seed.landlord_email)
      .order("sent_at", { ascending: false });

    const rows = invites ?? [];
    const ids = rows.map((r) => r.id);
    const { data: messages } = ids.length
      ? await supabaseAdmin
          .from("invite_messages")
          .select("id, invite_id, author_role, author_name, body, created_at")
          .in("invite_id", ids)
          .order("created_at")
      : { data: [] as never[] };

    const tenantIds = Array.from(
      new Set(
        rows
          .map((r) => (r.reports as unknown as { user_id?: string } | null)?.user_id)
          .filter((v): v is string => Boolean(v)),
      ),
    );
    const { data: profiles } = tenantIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", tenantIds)
      : { data: [] as never[] };
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    const list: PortalInvite[] = rows.map((r) => {
      const report = r.reports as unknown as {
        report_number: string;
        type: string;
        created_at: string;
        overall_hash: string | null;
        user_id: string;
        properties: { address: string; unit: string | null } | null;
      } | null;
      return {
        token: r.token,
        status: r.status,
        sent_at: r.sent_at,
        expires_at: r.expires_at,
        responded_at: r.responded_at,
        response_note: r.response_note,
        response_signature_name: r.response_signature_name,
        report_number: report?.report_number ?? "—",
        report_type: report?.type ?? "move_in",
        report_created_at: report?.created_at ?? r.sent_at,
        overall_hash: report?.overall_hash ?? null,
        address: report?.properties?.address ?? "Rental property",
        unit: report?.properties?.unit ?? null,
        tenant_name: report ? (nameById.get(report.user_id) ?? null) : null,
        messages: (messages ?? [])
          .filter((m) => m.invite_id === r.id)
          .map((m) => ({
            id: m.id,
            author_role: m.author_role,
            author_name: m.author_name,
            body: m.body,
            created_at: m.created_at,
          })),
      };
    });

    return { ok: true, landlordEmail: seed.landlord_email, invites: list };
  });

/** Public: landlord posts a reply on a dispute thread using their link token. */
export const postLandlordReply = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; body: string; authorName?: string }) => {
    const token = (input.token ?? "").trim();
    const body = (input.body ?? "").trim().slice(0, 4000);
    if (!token) throw new Error("Missing link token.");
    if (body.length < 3) throw new Error("Write a reply before sending.");
    return { token, body, authorName: (input.authorName ?? "").trim().slice(0, 120) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite } = await supabaseAdmin
      .from("landlord_invites")
      .select("id, report_id, landlord_name, user_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) throw new Error("This link is no longer valid.");

    const { error } = await supabaseAdmin.from("invite_messages").insert({
      invite_id: invite.id,
      report_id: invite.report_id,
      author_role: "landlord",
      author_name: data.authorName || invite.landlord_name || null,
      body: data.body,
    });
    if (error) throw new Error(error.message);

    const { notifyTenantOfLandlordResponse } = await import("@/lib/notify.server");
    await notifyTenantOfLandlordResponse({
      inviteId: invite.id,
      reportId: invite.report_id,
      tenantUserId: invite.user_id,
      event: "replied",
      landlordName: data.authorName || invite.landlord_name,
      note: data.body,
    });

    return { ok: true };

  });

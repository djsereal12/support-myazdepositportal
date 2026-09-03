import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { renderCampaignHtml, renderCampaignText } from "@/lib/marketing-template";

export type Subscriber = {
  id: string;
  email: string;
  full_name: string | null;
  source: string;
  status: string;
  created_at: string;
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  headline: string | null;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  status: string;
  recipient_count: number;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") throw new Error("Email is required");
  const email = value.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) throw new Error("Enter a valid email address");
  return email;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error("Unable to verify permissions");
  if (!data) throw new Error("Forbidden");
}

/** Public newsletter opt-in (website form). */
export const subscribeToMarketing = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string; fullName?: string; source?: string }) => ({
    email: normalizeEmail(data?.email),
    fullName:
      typeof data?.fullName === "string" && data.fullName.trim()
        ? data.fullName.trim().slice(0, 120)
        : null,
    source: data?.source === "app" ? "app" : "website",
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("marketing_subscribers").upsert(
      {
        email: data.email,
        full_name: data.fullName,
        source: data.source,
        status: "subscribed",
        unsubscribed_at: null,
      },
      { onConflict: "email" },
    );
    if (error) throw new Error(error.message);

    // Sync into the marketing audience; never block the visitor on provider errors.
    try {
      const { ensureAudience, upsertContact } = await import("@/lib/resend-marketing.server");
      const audienceId = await ensureAudience();
      const contactId = await upsertContact({
        audienceId,
        email: data.email,
        firstName: data.fullName?.split(" ")[0] ?? null,
      });
      if (contactId) {
        await supabaseAdmin
          .from("marketing_subscribers")
          .update({ resend_contact_id: contactId })
          .eq("email", data.email);
      }
    } catch (e) {
      console.error("Marketing audience sync failed:", e instanceof Error ? e.message : e);
    }

    return { ok: true };
  });

export const listSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Subscriber[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("marketing_subscribers")
      .select("id, email, full_name, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as Subscriber[];
  });

/** Adds confirmed app users to the marketing list (explicit admin action). */
export const importAppUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authList, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });
    if (error) throw new Error(error.message);

    const rows = authList.users
      .filter((u) => u.email && u.email_confirmed_at)
      .map((u) => ({
        email: u.email!.toLowerCase(),
        full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
        user_id: u.id,
        source: "app" as const,
      }));
    if (!rows.length) return { imported: 0 };

    const { data: existing } = await supabaseAdmin
      .from("marketing_subscribers")
      .select("email")
      .in(
        "email",
        rows.map((r) => r.email),
      );
    const known = new Set((existing ?? []).map((r) => r.email));
    const fresh = rows.filter((r) => !known.has(r.email));
    if (!fresh.length) return { imported: 0 };

    const { error: insertError } = await supabaseAdmin.from("marketing_subscribers").insert(fresh);
    if (insertError) throw new Error(insertError.message);

    try {
      const { ensureAudience, upsertContact } = await import("@/lib/resend-marketing.server");
      const audienceId = await ensureAudience();
      for (const row of fresh) {
        await upsertContact({
          audienceId,
          email: row.email,
          firstName: row.full_name?.split(" ")[0] ?? null,
        });
      }
    } catch (e) {
      console.error("Audience import sync failed:", e instanceof Error ? e.message : e);
    }

    return { imported: fresh.length };
  });

export const setSubscriberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "subscribed" | "unsubscribed" }) => {
    if (!data?.id) throw new Error("id required");
    if (data.status !== "subscribed" && data.status !== "unsubscribed")
      throw new Error("Invalid status");
    return data;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("marketing_subscribers")
      .update({
        status: data.status,
        unsubscribed_at: data.status === "unsubscribed" ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .select("email")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (row?.email) {
      try {
        const { ensureAudience, upsertContact } = await import("@/lib/resend-marketing.server");
        const audienceId = await ensureAudience();
        await upsertContact({
          audienceId,
          email: row.email,
          unsubscribed: data.status === "unsubscribed",
        });
      } catch (e) {
        console.error("Audience status sync failed:", e instanceof Error ? e.message : e);
      }
    }
    return { ok: true };
  });

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Campaign[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("marketing_campaigns")
      .select(
        "id, name, subject, preview_text, headline, body, cta_label, cta_url, status, recipient_count, error_message, sent_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as Campaign[];
  });

type CampaignInput = {
  id?: string;
  name: string;
  subject: string;
  previewText?: string;
  headline?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
};

function validateCampaign(data: CampaignInput): CampaignInput {
  const name = (data?.name ?? "").trim();
  const subject = (data?.subject ?? "").trim();
  const body = (data?.body ?? "").trim();
  if (!name) throw new Error("Campaign name is required");
  if (!subject) throw new Error("Subject line is required");
  if (!body) throw new Error("Email body is required");
  const ctaUrl = (data.ctaUrl ?? "").trim();
  if (ctaUrl && !/^https:\/\//.test(ctaUrl)) throw new Error("Button link must start with https://");
  return {
    id: data.id,
    name: name.slice(0, 120),
    subject: subject.slice(0, 160),
    previewText: (data.previewText ?? "").trim().slice(0, 160),
    headline: (data.headline ?? "").trim().slice(0, 160),
    body: body.slice(0, 8000),
    ctaLabel: (data.ctaLabel ?? "").trim().slice(0, 60),
    ctaUrl,
  };
}

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateCampaign)
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.name,
      subject: data.subject,
      preview_text: data.previewText || null,
      headline: data.headline || null,
      body: data.body,
      cta_label: data.ctaLabel || null,
      cta_url: data.ctaUrl || null,
      created_by: context.userId,
    };

    if (data.id) {
      const { data: current } = await supabaseAdmin
        .from("marketing_campaigns")
        .select("status")
        .eq("id", data.id)
        .maybeSingle();
      if (current?.status === "sent") throw new Error("A sent campaign cannot be edited");
      const { error } = await supabaseAdmin
        .from("marketing_campaigns")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: created, error } = await supabaseAdmin
      .from("marketing_campaigns")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id as string };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("id required");
    return data;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("marketing_campaigns")
      .delete()
      .eq("id", data.id)
      .neq("status", "sent");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendCampaignTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; to: string }) => ({
    id: data?.id,
    to: normalizeEmail(data?.to),
  }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: c, error } = await supabaseAdmin
      .from("marketing_campaigns")
      .select("subject, preview_text, headline, body, cta_label, cta_url")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const content = {
      headline: c.headline,
      body: c.body,
      ctaLabel: c.cta_label,
      ctaUrl: c.cta_url,
      previewText: c.preview_text,
    };
    const { sendPreviewEmail } = await import("@/lib/resend-marketing.server");
    await sendPreviewEmail({
      to: data.to,
      subject: c.subject,
      html: renderCampaignHtml(content, "https://myazdepositportal.live/legal"),
      text: renderCampaignText(content, "https://myazdepositportal.live/legal"),
    });
    return { ok: true };
  });

export const sendCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id) throw new Error("id required");
    return data;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: c, error } = await supabaseAdmin
      .from("marketing_campaigns")
      .select("id, name, subject, preview_text, headline, body, cta_label, cta_url, status")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (c.status === "sent" || c.status === "sending")
      throw new Error("This campaign has already been sent");

    const { count } = await supabaseAdmin
      .from("marketing_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "subscribed");

    await supabaseAdmin.from("marketing_campaigns").update({ status: "sending" }).eq("id", c.id);

    try {
      const { ensureAudience, createBroadcast, sendBroadcast } = await import(
        "@/lib/resend-marketing.server"
      );
      const audienceId = await ensureAudience();
      const content = {
        headline: c.headline,
        body: c.body,
        ctaLabel: c.cta_label,
        ctaUrl: c.cta_url,
        previewText: c.preview_text,
      };
      const broadcastId = await createBroadcast({
        audienceId,
        subject: c.subject,
        name: c.name,
        previewText: c.preview_text,
        html: renderCampaignHtml(content),
        text: renderCampaignText(content),
      });
      await sendBroadcast(broadcastId);

      await supabaseAdmin
        .from("marketing_campaigns")
        .update({
          status: "sent",
          resend_broadcast_id: broadcastId,
          recipient_count: count ?? 0,
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", c.id);

      return { ok: true, recipients: count ?? 0 };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Send failed";
      await supabaseAdmin
        .from("marketing_campaigns")
        .update({ status: "failed", error_message: message })
        .eq("id", c.id);
      throw new Error(message);
    }
  });

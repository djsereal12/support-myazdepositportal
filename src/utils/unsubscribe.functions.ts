import { createServerFn } from "@tanstack/react-start";

/** Public one-click unsubscribe — authorised by the signed token itself. */
export const unsubscribeWithToken = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => {
    const token = typeof data?.token === "string" ? data.token.trim() : "";
    if (!token || token.length > 512) throw new Error("Invalid unsubscribe link");
    return { token };
  })
  .handler(async ({ data }): Promise<{ ok: boolean; email: string | null }> => {
    const { verifyUnsubscribeToken } = await import("@/lib/unsubscribe.server");
    const email = verifyUnsubscribeToken(data.token);
    if (!email) return { ok: false, email: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("marketing_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("email", email);

    try {
      const { ensureAudience, upsertContact } = await import("@/lib/resend-marketing.server");
      const audienceId = await ensureAudience();
      await upsertContact({ audienceId, email, unsubscribed: true });
    } catch (e) {
      console.error("Unsubscribe audience sync failed:", e instanceof Error ? e.message : e);
    }

    return { ok: true, email };
  });

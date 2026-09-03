import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminPurchaseRow = {
  id: string;
  user_id: string | null;
  linked_email: string | null;
  email: string | null;
  phone: string | null;
  price_id: string;
  status: string;
  environment: string;
  amount_total: number | null;
  currency: string | null;
  stripe_session_id: string;
  stripe_customer_id: string | null;
  report_id: string | null;
  property_id: string | null;
  created_at: string;
};

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error("Unable to verify permissions");
  if (!data) throw new Error("Forbidden");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function digits(value: string) {
  return value.replace(/\D+/g, "");
}

async function decorate(admin: any, rows: any[]): Promise<AdminPurchaseRow[]> {
  const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))) as string[];
  const profiles = ids.length
    ? ((await admin.from("profiles").select("id, email, phone").in("id", ids)).data ?? [])
    : [];
  return rows.map((r) => {
    const p = profiles.find((x: any) => x.id === r.user_id);
    return {
      id: r.id,
      user_id: r.user_id ?? null,
      linked_email: p?.email ?? null,
      email: r.email ?? null,
      phone: p?.phone ?? null,
      price_id: r.price_id,
      status: r.status,
      environment: r.environment,
      amount_total: r.amount_total,
      currency: r.currency,
      stripe_session_id: r.stripe_session_id,
      stripe_customer_id: r.stripe_customer_id ?? null,
      report_id: r.report_id ?? null,
      property_id: r.property_id ?? null,
      created_at: r.created_at,
    };
  });
}

/** Search purchases by buyer email, account phone, or any payment identifier. */
export const searchPurchases = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { query: string }) => {
    const query = (data?.query ?? "").trim();
    if (query.length < 3) throw new Error("Enter at least 3 characters");
    return { query };
  })
  .handler(async ({ context, data }): Promise<AdminPurchaseRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const q = data.query;

    const select =
      "id, user_id, email, price_id, status, environment, amount_total, currency, stripe_session_id, stripe_customer_id, report_id, property_id, created_at";

    // Direct identifier matches (purchase id, session id, payment intent / customer id).
    const orParts = [`stripe_session_id.eq.${q}`, `stripe_customer_id.eq.${q}`];
    if (UUID_RE.test(q)) {
      orParts.push(`id.eq.${q}`, `report_id.eq.${q}`, `property_id.eq.${q}`);
    }
    if (q.includes("@") || /[a-z]/i.test(q)) orParts.push(`email.ilike.%${q}%`);

    const byField = await supabaseAdmin
      .from("purchases")
      .select(select)
      .or(orParts.join(","))
      .order("created_at", { ascending: false })
      .limit(50);

    const rows: any[] = byField.data ? [...byField.data] : [];

    // Phone or account-email lookup through profiles.
    const phone = digits(q);
    const profileFilters: string[] = [];
    if (q.includes("@") || /[a-z]/i.test(q)) profileFilters.push(`email.ilike.%${q}%`);
    if (phone.length >= 7) profileFilters.push(`phone.ilike.%${phone}%`, `phone.ilike.%${q}%`);
    if (profileFilters.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .or(profileFilters.join(","))
        .limit(50);
      const userIds = (profs ?? []).map((p: any) => p.id);
      if (userIds.length) {
        const { data: more } = await supabaseAdmin
          .from("purchases")
          .select(select)
          .in("user_id", userIds)
          .order("created_at", { ascending: false })
          .limit(50);
        for (const row of more ?? []) if (!rows.some((r) => r.id === row.id)) rows.push(row);
      }
    }

    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return decorate(supabaseAdmin, rows.slice(0, 50));
  });

/**
 * Re-sync a purchase against Stripe: refresh payment status and re-link the
 * buyer's account when the entitlement went missing (user_id is null or stale).
 */
export const resyncPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string; environment?: "sandbox" | "live" }) => {
    const sessionId = (data?.sessionId ?? "").trim();
    if (!sessionId) throw new Error("A Stripe checkout session id is required");
    const environment = data?.environment === "live" ? "live" : "sandbox";
    return { sessionId, environment };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { createStripeClient } = await import("@/lib/stripe.server");

    const { data: existing } = await supabaseAdmin
      .from("purchases")
      .select("*")
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();

    const env = (existing?.environment as "sandbox" | "live" | undefined) ?? data.environment;
    const stripe = createStripeClient(env);

    let session: any;
    try {
      session = await stripe.checkout.sessions.retrieve(data.sessionId);
    } catch {
      throw new Error(`Stripe has no ${env} checkout session with id ${data.sessionId}`);
    }

    const metadata = session.metadata ?? {};
    const buyerEmail: string | null =
      session.customer_details?.email ?? existing?.email ?? metadata.customerEmail ?? null;

    // Resolve the owning account: metadata first, then the verified auth user by email.
    let userId: string | null = metadata.userId ?? existing?.user_id ?? null;
    if (!userId && buyerEmail) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const match = list?.users.find(
        (u) => (u.email ?? "").toLowerCase() === buyerEmail.toLowerCase(),
      );
      userId = match?.id ?? null;
    }

    const status = session.payment_status === "paid" ? "paid" : (session.payment_status ?? "pending");

    const { error } = await (supabaseAdmin.from("purchases") as any).upsert(
      {
        user_id: userId,
        email: buyerEmail,
        price_id: metadata.priceId ?? existing?.price_id ?? "unknown",
        product_id: metadata.priceId ?? existing?.product_id ?? null,
        stripe_session_id: session.id,
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null),
        amount_total: session.amount_total != null ? session.amount_total / 100 : null,
        currency: session.currency ?? null,
        status: status === "no_payment_required" ? "paid" : status,
        environment: env,
        report_id: metadata.reportId ?? existing?.report_id ?? null,
        property_id: metadata.propertyId ?? existing?.property_id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_session_id" },
    );
    if (error) throw new Error(error.message);

    return {
      ok: true,
      created: !existing,
      linked: Boolean(userId),
      userId,
      email: buyerEmail,
      status,
      environment: env,
    };
  });

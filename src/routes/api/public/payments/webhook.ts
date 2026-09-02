import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

async function recordPurchase(session: any, env: StripeEnv, status: string) {
  const metadata = session.metadata ?? {};
  await getSupabase()
    .from("purchases")
    .upsert(
      {
        user_id: metadata.userId ?? null,
        email: session.customer_details?.email ?? null,
        price_id: metadata.priceId ?? "unknown",
        product_id: metadata.priceId ?? null,
        stripe_session_id: session.id,
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : (session.customer?.id ?? null),
        amount_total: session.amount_total != null ? session.amount_total / 100 : null,
        currency: session.currency ?? null,
        status,
        environment: env,
        report_id: metadata.reportId ?? null,
        property_id: metadata.propertyId ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_session_id" },
    );
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await recordPurchase(session, env, session.payment_status === "unpaid" ? "pending" : "paid");
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await recordPurchase(event.data.object, env, "paid");
      break;
    case "checkout.session.async_payment_failed":
      await recordPurchase(event.data.object, env, "failed");
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});

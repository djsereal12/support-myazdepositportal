import { createServerFn } from "@tanstack/react-start";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type CheckoutSessionResult = { clientSecret: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId: string },
): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  const found = await stripe.customers.search({
    query: `metadata['userId']:'${options.userId}'`,
    limit: 1,
  });
  if (found.data.length && found.data[0]) return found.data[0].id;

  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    metadata: { userId: options.userId },
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      priceId: string;
      customerEmail?: string;
      userId?: string;
      reportId?: string;
      propertyId?: string;
      returnUrl: string;
      environment: StripeEnv;
    }) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
      return data;
    },
  )
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);

      // Identity is derived from the verified session only — client-supplied
      // userId/customerEmail are ignored to prevent Stripe customer hijacking.
      const { resolveVerifiedIdentity } = await import("@/lib/auth-identity.server");
      const identity = await resolveVerifiedIdentity();
      const userId = identity?.userId;
      const customerEmail = identity?.email;

      // Without a verified account the purchase could never be linked to
      // anyone, so the buyer would pay and receive nothing. Block it.
      if (!userId) {
        return {
          error: "Please sign in before checking out so your purchase unlocks your account.",
        };
      }

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const stripePrice = prices.data[0];
      if (!stripePrice) throw new Error("Price not found");

      const customerId = userId
        ? await resolveOrCreateCustomer(stripe, {
            userId,
            ...(customerEmail ? { email: customerEmail } : {}),
          })
        : undefined;

      const productId =
        typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);

      const isRecurring = stripePrice.type === "recurring";

      const params = {
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        ...(customerId && { customer: customerId }),
        ...(isRecurring
          ? {
              subscription_data: {
                metadata: {
                  ...(userId ? { userId } : {}),
                  priceId: data.priceId,
                },
              },
            }
          : { payment_intent_data: { description: product.name } }),
        managed_payments: { enabled: true },
        metadata: {
          ...(userId ? { userId } : {}),
          ...(data.reportId ? { reportId: data.reportId } : {}),
          ...(data.propertyId ? { propertyId: data.propertyId } : {}),
          priceId: data.priceId,
          managed_payments: "true",
        },
      };

      const session = await stripe.checkout.sessions.create(
        params as unknown as import("stripe").Stripe.Checkout.SessionCreateParams,
      );

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

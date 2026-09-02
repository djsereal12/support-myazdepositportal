import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession } from "@/utils/payments.functions";

interface StripeEmbeddedCheckoutProps {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  reportId?: string;
  propertyId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({
  priceId,
  customerEmail,
  userId,
  reportId,
  propertyId,
  returnUrl,
}: StripeEmbeddedCheckoutProps) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createCheckoutSession({
      data: {
        priceId,
        ...(customerEmail ? { customerEmail } : {}),
        ...(userId ? { userId } : {}),
        ...(reportId ? { reportId } : {}),
        ...(propertyId ? { propertyId } : {}),
        returnUrl: returnUrl || window.location.href,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Checkout could not be started");
    return result.clientSecret;
  };

  return (
    <div id="checkout" className="rounded-2xl bg-card p-2">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

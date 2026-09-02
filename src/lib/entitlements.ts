import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, PRICES } from "@/lib/stripe";

export type Purchase = {
  id: string;
  price_id: string;
  status: string;
  report_id: string | null;
  property_id: string | null;
};

function env(): string {
  try {
    return getStripeEnvironment();
  } catch {
    return "sandbox";
  }
}

export async function fetchPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from("purchases")
    .select("id, price_id, status, report_id, property_id")
    .eq("status", "paid")
    .eq("environment", env());
  if (error) throw error;
  return data ?? [];
}

/** A report is unlocked by a single-report purchase for that report, or a bundle on its property. */
export function reportUnlocked(
  purchases: Purchase[],
  reportId: string,
  propertyId?: string | null,
): boolean {
  return purchases.some(
    (p) =>
      p.report_id === reportId ||
      (p.price_id === PRICES.bundle && !!propertyId && p.property_id === propertyId),
  );
}

export function demandLetterUnlocked(purchases: Purchase[], propertyId: string): boolean {
  return purchases.some((p) => p.price_id === PRICES.demandLetter && p.property_id === propertyId);
}

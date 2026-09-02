import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, PRICES } from "@/lib/stripe";

export type Purchase = {
  id: string;
  price_id: string;
  status: string;
  report_id: string | null;
  property_id: string | null;
  created_at: string;
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
    .select("id, price_id, status, report_id, property_id, created_at")
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

/** Certified court-ready export ($39) purchased for a specific report. */
export function certifiedPdfUnlocked(purchases: Purchase[], reportId: string): boolean {
  return purchases.some((p) => p.price_id === PRICES.certifiedPdf && p.report_id === reportId);
}

/** Landlord response letter ($19) purchased for a specific report. */
export function landlordLetterUnlocked(purchases: Purchase[], reportId: string): boolean {
  return purchases.some((p) => p.price_id === PRICES.landlordLetter && p.report_id === reportId);
}

/** Landlord annual unlimited plan ($299/yr), active within the last year. */
export function landlordUnlimitedActive(purchases: Purchase[]): boolean {
  const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
  return purchases.some(
    (p) => p.price_id === PRICES.landlordUnlimited && new Date(p.created_at).getTime() > yearAgo,
  );
}

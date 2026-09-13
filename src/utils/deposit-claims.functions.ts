import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const schema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: optionalText(40),
  rentalAddress: z.string().trim().min(1, "Rental address is required").max(200),
  unit: optionalText(40),
  city: optionalText(80),
  landlordName: optionalText(120),
  landlordEmail: z
    .union([z.string().trim().email("Enter a valid landlord email").max(255), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  depositAmount: z.number().nonnegative().max(1_000_000).nullable().optional(),
  amountWithheld: z.number().nonnegative().max(1_000_000).nullable().optional(),
  moveOutDate: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
  disputeReason: z.string().trim().min(1, "Tell us what happened").max(200),
  details: optionalText(2000),
  source: z.enum(["pricing", "auth"]).default("pricing"),
});

export type DepositClaimInput = z.input<typeof schema>;

const money = (v: number | null | undefined) =>
  typeof v === "number" ? `$${v.toFixed(2)}` : null;

/** Public deposit-claim intake: stores the submission and notifies support. */
export const submitDepositClaim = createServerFn({ method: "POST" })
  .inputValidator((input: DepositClaimInput) => schema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");

    const { data: claim, error } = await supabaseAdmin
      .from("deposit_claims")
      .insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        rental_address: data.rentalAddress,
        unit: data.unit,
        city: data.city,
        landlord_name: data.landlordName,
        landlord_email: data.landlordEmail,
        deposit_amount: data.depositAmount ?? null,
        amount_withheld: data.amountWithheld ?? null,
        move_out_date: data.moveOutDate,
        dispute_reason: data.disputeReason,
        details: data.details,
        source: data.source,
      })
      .select("id")
      .single();

    if (error || !claim) {
      console.error("deposit claim insert failed", error);
      throw new Error("We could not save your claim. Please try again.");
    }

    try {
      await sendTemplateEmail("deposit-claim", "support@myazdepositportal.live", {
        templateData: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          rentalAddress: data.rentalAddress,
          unit: data.unit,
          city: data.city,
          landlordName: data.landlordName,
          landlordEmail: data.landlordEmail,
          depositAmount: money(data.depositAmount),
          amountWithheld: money(data.amountWithheld),
          moveOutDate: data.moveOutDate,
          disputeReason: data.disputeReason,
          details: data.details,
          source: data.source,
          claimId: claim.id,
        },
        idempotencyKey: `deposit-claim-${claim.id}`,
        replyTo: data.email,
      });
    } catch (err) {
      console.error("deposit claim notification failed", err);
    }

    return { ok: true as const, claimId: claim.id };
  });

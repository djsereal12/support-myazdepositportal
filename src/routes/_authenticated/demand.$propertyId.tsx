import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Page } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { money, businessDaysFrom, formatDate } from "@/lib/deposit";
import { fetchPurchases, demandLetterUnlocked } from "@/lib/entitlements";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PRICES } from "@/lib/stripe";
import { Printer, Save, Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/demand/$propertyId")({
  head: () => ({
    meta: [
      { title: "Demand letter — DEPOSIT" },
      {
        name: "description",
        content:
          "Generate a formal Arizona security deposit demand letter citing A.R.S. § 33-1321(D) and (E).",
      },
      { property: "og:title", content: "Demand letter — DEPOSIT" },
      { property: "og:description", content: "A formal, statute-cited demand your landlord must answer." },
    ],
  }),
  component: Demand,
});

function Demand() {
  const { propertyId } = Route.useParams();
  const [withheld, setWithheld] = useState("");
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().slice(0, 10));
  const [tenantName, setTenantName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["demand-context", propertyId],
    queryFn: async () => {
      const { data: property, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();
      if (error) throw error;
      const { data: profile } = await supabase.from("profiles").select("*").maybeSingle();
      const { data: report } = await supabase
        .from("reports")
        .select("id, report_number, overall_hash, qr_verification_url")
        .eq("property_id", propertyId)
        .eq("type", "move_out")
        .order("created_at", { ascending: false })
        .maybeSingle();
      return { property, profile, report };
    },
  });

  const property = data?.property;
  const tenant = tenantName || data?.profile?.full_name || data?.profile?.email || "Tenant";
  const amount = Number(withheld || 0);
  const deadline = businessDaysFrom(new Date(moveOutDate), 14);
  const doubled = amount * 2;

  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: u }) =>
      setUser(u.user ? { id: u.user.id, ...(u.user.email ? { email: u.user.email } : {}) } : null),
    );
  }, []);
  const { data: purchases } = useQuery({ queryKey: ["purchases"], queryFn: fetchPurchases });
  const unlocked = demandLetterUnlocked(purchases ?? [], propertyId);

  function unlock() {
    openCheckout({
      priceId: PRICES.demandLetter,
      propertyId,
      ...(data?.report?.id ? { reportId: data.report.id } : {}),
      ...(user?.id ? { userId: user.id } : {}),
      ...(user?.email ? { customerEmail: user.email } : {}),
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  }



  async function save() {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("demand_letters").insert({
      property_id: propertyId,
      report_id: data?.report?.id ?? null,
      user_id: userData.user!.id,
      amount_withheld: amount,
      body: letterText(),
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Demand letter saved to your file");
  }

  function letterText() {
    return [
      `RE: Demand for return of security deposit — ${property?.address ?? ""}${property?.unit ? ` ${property.unit}` : ""}`,
      "",
      `Dear ${property?.landlord_name ?? "Landlord"},`,
      "",
      `I vacated the above premises on ${new Date(moveOutDate).toLocaleDateString("en-US")} and provided a forwarding address. My security deposit was ${money(property?.deposit_amount)}, of which ${money(amount)} has been wrongfully withheld.`,
      "",
      `Under A.R.S. § 33-1321(D), you had fourteen (14) business days — excluding Saturdays, Sundays and legal holidays — after termination of the tenancy and delivery of possession to return the deposit together with an itemized list of all deductions. That deadline was ${deadline.toLocaleDateString("en-US")}.`,
      "",
      `Under A.R.S. § 33-1321(E), a tenant may recover the property and money wrongfully withheld plus damages of up to twice the amount wrongfully withheld — in this case up to ${money(doubled)}.`,
      "",
      `The condition of the unit is documented in DEPOSIT report ${data?.report?.report_number ?? "(move-out report pending)"}. Every media file is fingerprinted with SHA-256 and stamped with GPS coordinates and capture time; the report integrity seal is ${data?.report?.overall_hash?.slice(0, 32) ?? "pending"}…`,
      "",
      `Please remit ${money(amount)} within ten (10) days of the date of this letter. If payment is not received, I intend to pursue all remedies available under A.R.S. § 33-1321(E), including double damages and court costs.`,
      "",
      "Sincerely,",
      tenant,
    ].join("\n");
  }

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/properties/$propertyId"
          params={{ propertyId }}
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          ← Property file
        </Link>
        {unlocked ? (
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Save to file
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
            >
              <Printer className="h-3.5 w-3.5" /> Save as PDF
            </button>
          </div>
        ) : (
          <button
            onClick={unlock}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
          >
            <Lock className="h-3.5 w-3.5" /> Unlock demand letter — $29
          </button>
        )}
      </div>

      {isOpen ? (
        <section className="glass-panel mt-6 p-6 print:hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Complete your purchase</h2>
            <button
              onClick={closeCheckout}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
          {checkoutElement}
        </section>
      ) : null}



      <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="glass-panel h-fit space-y-4 p-6 print:hidden">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Dispute letter · $29
          </p>
          <Field label="Your full name" value={tenantName} onChange={setTenantName} placeholder={tenant} />
          <Field
            label="Amount withheld"
            type="number"
            value={withheld}
            onChange={setWithheld}
            placeholder="1800"
          />
          <Field label="Move-out date" type="date" value={moveOutDate} onChange={setMoveOutDate} />
          <div className="rounded-xl bg-lavender-soft p-4 text-xs text-accent-foreground">
            <p>
              14 business-day deadline: <strong>{deadline.toLocaleDateString("en-US")}</strong>
            </p>
            <p className="mt-1">
              Potential recovery under § 33-1321(E): <strong>{money(doubled)}</strong>
            </p>
          </div>
        </aside>

        <article className="rounded-2xl border border-border bg-card p-8 shadow-soft sm:p-12">
          <p className="font-script text-3xl text-lavender-deep">Deposit</p>
          <p className="mt-8 text-xs text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
          </p>
          <p className="mt-6 text-sm">
            {property?.landlord_name ?? "Landlord"}
            <br />
            {property?.landlord_email ?? ""}
          </p>
          <pre className="mt-8 whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {letterText()}
          </pre>
          <div className="mt-12 grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
            <div>
              <div className="h-10 border-b border-foreground/40" />
              <p className="mt-2 text-xs text-muted-foreground">Tenant signature / date</p>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>Sent {formatDate(new Date().toISOString())}</p>
              <p className="mt-1">Supporting evidence: {data?.report?.report_number ?? "—"}</p>
            </div>
          </div>
        </article>
      </div>
    </Page>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

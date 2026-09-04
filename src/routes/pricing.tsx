import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Page } from "@/components/site-shell";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PRICES } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — deposit" },
      {
        name: "description",
        content:
          "$14.99 per report, $24.99 for the Move-In + Move-Out + Comparison bundle, $29 for a formal dispute letter.",
      },
      { property: "og:title", content: "Pricing — deposit" },
      {
        property: "og:description",
        content: "Protect an $1,800 average deposit loss for less than $25.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pricing,
});

const tiers = [
  {
    name: "Single Report",
    price: "$14.99",
    tag: "per report",
    priceId: PRICES.singleReport,
    features: [
      "One guided 8-room scan",
      "SHA-256 hash on every file",
      "GPS, device + weather stamp",
      "Court-ready PDF with QR verify",
    ],
  },
  {
    name: "Full Protection Bundle",
    price: "$24.99",
    tag: "move-in + move-out + comparison",
    featured: true,
    priceId: PRICES.bundle,
    features: [
      "Everything in Single Report, twice",
      "Automatic side-by-side comparison",
      "Damage flags: new vs. pre-existing",
      "Shareable landlord link",
    ],
  },
  {
    name: "Dispute Letter",
    price: "$29",
    tag: "one-time add-on",
    priceId: PRICES.demandLetter,
    features: [
      "Auto-filled tenant + landlord details",
      "Cites A.R.S. § 33-1321(D) and (E)",
      "14 business-day deadline computed",
      "Formal, printable demand PDF",
    ],
  },
  {
    name: "Certified Court-Ready PDF",
    price: "$39",
    tag: "premium export",
    priceId: PRICES.certifiedPdf,
    features: [
      "Full SHA-256 hash manifest page",
      "Chain-of-custody metadata appendix",
      "QR verification cover sheet",
      "Notarization-ready signature block",
    ],
  },
];

const landlordTiers = [
  {
    name: "Response Letter",
    price: "$19",
    tag: "per letter",
    priceId: PRICES.landlordLetter,
    features: [
      "Auto-filled from the tenant's report",
      "Itemized deduction breakdown",
      "Cites A.R.S. § 33-1321(D)",
      "Delivered to the tenant's file + printable",
    ],
  },
  {
    name: "Landlord Unlimited",
    price: "$299",
    tag: "per year",
    priceId: PRICES.landlordUnlimited,
    features: [
      "Unlimited tenants and reports",
      "Unlimited disputes and response letters",
      "Every new tenant you onboard",
      "Charge your tenants for their own scans",
    ],
  },
];

function Pricing() {
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(
        data.user
          ? { id: data.user.id, ...(data.user.email ? { email: data.user.email } : {}) }
          : null,
      );
      setCheckedAuth(true);
    });
  }, []);

  const signedIn = checkedAuth && !!user?.id;

  function buy(priceId: string) {
    if (!signedIn) {
      void navigate({ to: "/auth", search: { next: "/pricing" } });
      return;
    }
    openCheckout({
      priceId,
      ...(user?.id ? { userId: user.id } : {}),
      ...(user?.email ? { customerEmail: user.email } : {}),
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  }

  return (
    <Page>
      <PaymentTestModeBanner />
      <section className="mt-4 rounded-3xl border border-border lavender-wash px-6 py-14 shadow-lift sm:px-12">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          Less than a dinner out. Against an{" "}
          <span className="font-script text-5xl font-normal holo-text">$1,800</span> average loss.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Arizona renters lose roughly $1,800 on average when a deposit dispute goes undocumented.
          Every plan below costs under 2% of that.
        </p>
      </section>

      {isOpen ? (
        <section className="glass-panel mt-8 p-6">
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

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiers.map((t) => (
          <article
            key={t.name}
            className={`glass-panel flex flex-col p-8 ${t.featured ? "ring-2 ring-lavender/40" : ""}`}
          >
            {t.featured ? (
              <span className="mb-4 w-fit rounded-full bg-lavender-soft px-3 py-1 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-accent-foreground">
                Most protection
              </span>
            ) : null}
            <h2 className="text-xl font-semibold">{t.name}</h2>
            <p className="mt-4 text-display text-4xl font-semibold">{t.price}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {t.tag}
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => buy(t.priceId)}
              className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                t.featured
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card hover:bg-accent"
              }`}
            >
              {signedIn ? `Buy ${t.price}` : `Sign in to buy ${t.price}`}
            </button>
          </article>
        ))}
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">For landlords</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Review tenant reports, file itemized disputes and send formal responses — one letter at a
          time, or unlimited for every unit you manage.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {landlordTiers.map((t) => (
            <article key={t.name} className="glass-panel flex flex-col p-8">
              <h3 className="text-xl font-semibold">{t.name}</h3>
              <p className="mt-4 text-display text-4xl font-semibold">{t.price}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {t.tag}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => buy(t.priceId)}
                className="mt-8 rounded-full border border-border bg-card px-5 py-3 text-center text-sm font-medium transition-opacity hover:bg-accent"
              >
                {signedIn ? `Buy ${t.price}` : `Sign in to buy ${t.price}`}
              </button>
            </article>
          ))}
        </div>
      </section>
    </Page>
  );
}

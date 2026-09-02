import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/site-shell";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — DEPOSIT" },
      {
        name: "description",
        content:
          "$14.99 per report, $24.99 for the Move-In + Move-Out + Comparison bundle, $29 for a formal dispute letter.",
      },
      { property: "og:title", content: "Pricing — DEPOSIT" },
      {
        property: "og:description",
        content: "Protect an $1,800 average deposit loss for less than $25.",
      },
    ],
  }),
  component: Pricing,
});

const tiers = [
  {
    name: "Single Report",
    price: "$14.99",
    tag: "per report",
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
    features: [
      "Auto-filled tenant + landlord details",
      "Cites A.R.S. § 33-1321(D) and (E)",
      "14 business-day deadline computed",
      "Formal, printable demand PDF",
    ],
  },
];

function Pricing() {
  return (
    <Page>
      <section className="rounded-3xl border border-border lavender-wash px-6 py-14 shadow-lift sm:px-12">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          Less than a dinner out. Against an{" "}
          <span className="font-script text-5xl font-normal text-lavender-deep">$1,800</span> average
          loss.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Arizona renters lose roughly $1,800 on average when a deposit dispute goes undocumented.
          Every plan below costs under 2% of that.
        </p>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
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
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.tag}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-muted-foreground">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-lavender" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/dashboard"
              className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                t.featured
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card hover:bg-accent"
              }`}
            >
              Get started
            </Link>
          </article>
        ))}
      </section>
    </Page>
  );
}

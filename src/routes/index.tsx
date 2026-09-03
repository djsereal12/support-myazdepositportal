import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/site-shell";
import { ShieldCheck, Fingerprint, MapPin, FileText, ScanLine, Scale } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DEPOSIT — Arizona Security Deposit Protection" },
      {
        name: "description",
        content:
          "Protect your Arizona security deposit with verifiable photo evidence per A.R.S. §33-1321. $14.99",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://myazdepositportal.live/" },
      { property: "og:title", content: "DEPOSIT — Arizona Security Deposit Protection" },
      {
        property: "og:description",
        content:
          "Protect your Arizona security deposit with verifiable photo evidence per A.R.S. §33-1321. $14.99",
      },
      { property: "og:image", content: "https://myazdepositportal.live/og-image.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DEPOSIT — Arizona Security Deposit Protection" },
      {
        name: "twitter:description",
        content:
          "Protect your Arizona security deposit with verifiable photo evidence per A.R.S. §33-1321. $14.99",
      },
      { name: "twitter:image", content: "https://myazdepositportal.live/og-image.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://myazdepositportal.live/" }],
  }),
  component: Landing,
});

const steps = [
  {
    icon: ScanLine,
    title: "Guided scan",
    body: "Eight prompts walk you through the exact spots landlords charge for. No guessing, no missed corners.",
  },
  {
    icon: Fingerprint,
    title: "Hashed on capture",
    body: "Every photo gets a SHA-256 fingerprint, GPS pin, device signature and timestamp the moment it uploads.",
  },
  {
    icon: FileText,
    title: "Court-ready report",
    body: "A numbered report with a verification QR, statute footer and signature lines you can hand to anyone.",
  },
];

function Landing() {
  return (
    <Page>
      <section className="relative overflow-hidden rounded-3xl border border-border lavender-wash px-6 py-16 shadow-lift sm:px-14 sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> A.R.S. § 33-1321
        </span>
        <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl">
          The average renter loses{" "}
          <span className="font-script text-5xl font-normal text-lavender-deep sm:text-7xl">
            $1,800
          </span>{" "}
          to a deposit they never see again.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          deposit turns move-in day into evidence. Guided room-by-room capture, cryptographic
          hashing, GPS and weather stamps — sealed into a report your landlord can't argue with.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="btn-glass-pink px-6 py-3 text-sm font-medium"
          >
            Start your move-in scan
          </Link>
          <Link
            to="/pricing"
            className="btn-glass px-6 py-3 text-sm font-medium"
          >
            See pricing
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <article key={s.title} className="glass-panel p-7">
            <s.icon className="h-5 w-5 text-lavender" strokeWidth={1.6} />
            <h2 className="mt-5 text-xl font-semibold">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="glass-panel p-8 sm:p-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">What gets captured, automatically</h2>
          <ul className="mt-7 grid gap-4 sm:grid-cols-2">
            {[
              ["SHA-256 file hash", "Any edit breaks the fingerprint."],
              ["GPS coordinates", "Proves you were at the unit."],
              ["Device signature", "Model + browser recorded with each file."],
              ["Weather snapshot", "112°F Clear — Phoenix, AZ."],
              ["Capture timestamp", "To the millisecond, at upload."],
              ["Overall report hash", "Every file hash chained into one seal."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-2xl border border-border bg-card/70 p-4">
                <p className="text-sm font-medium">{t}</p>
                <p className="mt-1 text-xs text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel flex flex-col justify-between p-8 sm:p-10">
          <div>
            <Scale className="h-5 w-5 text-lavender" strokeWidth={1.6} />
            <h2 className="mt-5 text-2xl font-semibold">Arizona gives you leverage</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Under § 33-1321(D) a landlord has 14 business days to return your deposit with an
              itemized list. Under § 33-1321(E) you may recover up to twice the amount wrongfully
              withheld.
            </p>
          </div>
          <Link
            to="/law"
            className="btn-glass mt-8 w-fit px-5 py-2.5 text-sm font-medium"
          >
            <MapPin className="h-4 w-4" /> Read the statute
          </Link>
        </div>
      </section>
    </Page>
  );
}

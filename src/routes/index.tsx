import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/site-shell";
import {
  ShieldCheck,
  Fingerprint,
  MapPin,
  FileText,
  ScanLine,
  Scale,
  Camera,
  Lock,
  QrCode,
  Star,
} from "lucide-react";

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

const PROMPTS = [
  "Front door & locks",
  "Kitchen",
  "Bathroom",
  "Floors",
  "Walls & ceilings",
  "Windows",
  "Appliances",
  "Exterior / patio",
];

const steps = [
  {
    icon: ScanLine,
    step: "Step 1",
    title: "Walk the unit",
    body: "Eight guided prompts — the exact spots landlords charge for. Camera opens on tap, five seconds each.",
  },
  {
    icon: Fingerprint,
    step: "Step 2",
    title: "Auto-sealed",
    body: "Each file gets a SHA-256 fingerprint, GPS pin, device signature, weather stamp and timestamp at upload.",
  },
  {
    icon: QrCode,
    step: "Step 3",
    title: "Get your PDF",
    body: "A numbered report with a verification QR, statute footer and signature lines — emailed to your landlord.",
  },
];

const testimonials = [
  {
    name: "Maya R.",
    city: "Phoenix",
    quote:
      "They tried to charge me $640 for grout I photographed on day one. Sent the hash report, got the full deposit back in nine days.",
    amount: "$1,450 returned",
  },
  {
    name: "Deshawn P.",
    city: "Tucson",
    quote:
      "Move-out was chaos. Having the same eight rooms already documented meant I just re-ran the scan and compared.",
    amount: "$900 returned",
  },
  {
    name: "Ana G.",
    city: "Tempe",
    quote:
      "The demand letter citing 33-1321 did it. My landlord replied the next morning with a check.",
    amount: "$1,200 returned",
  },
];

function Landing() {
  return (
    <Page>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border lavender-wash px-6 py-14 shadow-lift sm:px-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> A.R.S. § 33-1321
            </span>
            <h1 className="mt-7 max-w-2xl text-4xl font-semibold leading-[1.05] sm:text-6xl">
              The average renter loses{" "}
              <span className="font-script text-5xl font-normal holo-text sm:text-7xl">$1,800</span>{" "}
              to a deposit they never see again.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Five minutes on move-in day. Guided room-by-room capture, cryptographic hashing, GPS
              and weather stamps — sealed into a report your landlord can't argue with.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/auth"
                className="btn-glass-pink justify-center px-6 py-4 text-sm font-medium sm:py-3"
              >
                <Camera className="h-4 w-4" /> Start free move-in scan
              </Link>
              <Link
                to="/sample"
                className="btn-glass justify-center px-6 py-4 text-sm font-medium sm:py-3"
              >
                See sample report
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free first scan · no card required · works on any phone browser.
            </p>
          </div>

          {/* Illustrative phone capture screen */}
          <PhoneMock />
        </div>
      </section>

      {/* Trust strip */}
      <section className="mt-4 grid gap-3 md:grid-cols-3">
        {[
          {
            icon: Scale,
            title: "Not legal advice",
            body: "An evidence tool built for A.R.S. § 33-1321 — statute text included in every report.",
          },
          {
            icon: Fingerprint,
            title: "SHA-256 verified",
            body: "No edits possible. Any edit breaks the fingerprint and the report stops matching.",
          },
          {
            icon: Lock,
            title: "Private by default",
            body: "Photos stay on your device until you seal the report. Storage is private, per-account.",
          },
        ].map((t) => (
          <div key={t.title} className="glass-panel flex gap-3 p-5">
            <t.icon className="mt-0.5 h-4 w-4 shrink-0 text-lavender" strokeWidth={1.6} />
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold sm:text-3xl">How it works</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <article key={s.title} className="glass-panel p-7">
              <p className="text-[0.6rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                {s.step}
              </p>
              <s.icon className="mt-4 h-5 w-5 text-lavender" strokeWidth={1.6} />
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              {s.step === "Step 1" ? (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {PROMPTS.map((p) => (
                    <li
                      key={p}
                      className="rounded-full border border-border bg-card/70 px-2.5 py-1 text-[0.65rem] text-muted-foreground"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              ) : null}
              {s.step === "Step 2" ? <SealAnimation /> : null}
              {s.step === "Step 3" ? (
                <Link
                  to="/sample"
                  className="btn-glass mt-4 w-fit px-4 py-2 text-xs font-medium"
                >
                  View a sample report
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {/* Capture detail + statute */}
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
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/calculator" className="btn-glass-pink px-5 py-2.5 text-sm font-medium">
              <FileText className="h-4 w-4" /> Calculate your claim
            </Link>
            <Link to="/law" className="btn-glass px-5 py-2.5 text-sm font-medium">
              <MapPin className="h-4 w-4" /> Read the statute
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold sm:text-3xl">Built for Arizona renters</h2>
          <p className="text-xs text-muted-foreground">
            Not a generic inventory app — statute, deadlines and heat stamps are local.
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="glass-panel p-7">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current text-lavender" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 text-xs">
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground"> · {t.city}, AZ · {t.amount}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="glass-panel mt-4 flex flex-col items-center gap-1 p-6 text-center">
          <p className="font-script text-4xl holo-text">1,247</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            reports sealed in Arizona this year
          </p>
        </div>
        <p className="mt-3 text-[0.65rem] text-muted-foreground">
          Testimonials and counter shown are illustrative examples while we collect verified renter
          stories.
        </p>
      </section>

      {/* Closing CTA */}
      <section className="glass-panel mt-8 flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Move-in day takes five minutes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {"\n"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/auth" className="btn-glass-pink px-5 py-2.5 text-sm font-medium">
            <Camera className="h-4 w-4" /> Start scan
          </Link>
          <Link to="/pricing" className="btn-glass px-5 py-2.5 text-sm font-medium">
            See pricing
          </Link>
        </div>
      </section>
    </Page>
  );
}

function PhoneMock() {
  return (
    <div className="mx-auto w-full max-w-[17rem]">
      <div className="rounded-[2rem] border border-border bg-card p-3 shadow-lift">
        <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
          <div className="flex items-center justify-between text-[0.6rem] text-muted-foreground">
            <span>8:14</span>
            <span>Move-in scan · 3 of 8</span>
          </div>
          <div className="mt-3 aspect-[3/4] rounded-2xl border border-border bg-muted/60 p-3">
            <div className="flex h-full flex-col justify-between">
              <span className="w-fit rounded-full bg-background/80 px-2 py-1 text-[0.58rem] font-medium">
                Bathroom — caulk &amp; grout
              </span>
              <div className="space-y-1 text-[0.55rem] text-muted-foreground">
                <p className="rounded bg-background/80 px-2 py-1">112°F Clear — Phoenix, AZ</p>
                <p className="rounded bg-background/80 px-2 py-1">33.4576° N, 112.0740° W</p>
                <p className="rounded bg-background/80 px-2 py-1 font-mono">
                  sha256 c41f77b2…0d18
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-foreground/30">
              <span className="h-9 w-9 rounded-full bg-foreground/80" />
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">
        Illustrative capture screen
      </p>
    </div>
  );
}

function SealAnimation() {
  return (
    <div className="mt-4 space-y-1.5 text-[0.65rem]">
      {[
        ["Hashing photo", "c41f77b2…0d18"],
        ["GPS pin", "33.4576° N, 112.0740° W"],
        ["Sealed", "Mar 3, 2026 8:14:22 AM"],
      ].map(([k, v], i) => (
        <div
          key={k}
          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/70 px-3 py-1.5"
          style={{ animation: `holo-shift 6s ease-in-out ${i * 0.4}s infinite` }}
        >
          <span className="text-muted-foreground">{k}</span>
          <span className="truncate font-mono">{v}</span>
        </div>
      ))}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/site-shell";
import { SampleReportSheet, FauxQr } from "@/components/sample-report";
import { ShieldCheck, QrCode, FileCheck2 } from "lucide-react";

export const Route = createFileRoute("/sample")({
  head: () => ({
    meta: [
      { title: "Sample Arizona move-in report — see what you get | deposit" },
      {
        name: "description",
        content:
          "A redacted example of a court-ready Arizona move-in report: photo hashes, GPS, weather stamp, verification QR, statute footer and signature lines.",
      },
      { property: "og:type", content: "article" },
      { property: "og:title", content: "Sample Arizona move-in report — deposit" },
      {
        property: "og:description",
        content:
          "See the exact report your landlord receives: SHA-256 photo hashes, GPS, weather stamp and a verification QR.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Sample Arizona move-in report" },
      {
        name: "twitter:description",
        content: "Redacted example of a hash-sealed, court-ready move-in report.",
      },
    ],
  }),
  component: SamplePage,
});

function SamplePage() {
  return (
    <Page>
      <section className="rounded-3xl border border-border lavender-wash px-6 py-12 shadow-lift sm:px-12">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Sample report · illustrative, redacted
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          This is what your landlord{" "}
          <span className="font-script text-5xl font-normal holo-text">actually receives.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every area photographed, each file fingerprinted with SHA-256, the GPS point and weather
          at capture, and a verification code anyone can scan to confirm nothing changed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/auth" className="btn-glass-pink px-6 py-3 text-sm font-medium">
            Start free move-in scan
          </Link>
          <Link to="/calculator" className="btn-glass px-6 py-3 text-sm font-medium">
            Check your deadline
          </Link>
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SampleReportSheet />

        <div className="flex flex-col gap-4">
          <div id="verify" className="glass-panel p-7">
            <QrCode className="h-5 w-5 text-lavender" strokeWidth={1.6} />
            <h2 className="mt-4 text-xl font-semibold">The QR is the point</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              On a real report the code opens a public verification page — no login — where the
              landlord, a judge, or a mediator sees the same photos and hashes you sealed on move-in
              day. Real links look like{" "}
              <span className="font-mono text-xs">/verify/&lt;token&gt;</span>.
            </p>
            <div className="mt-5 flex items-center gap-4">
              <div className="w-24">
                <FauxQr seed={19} />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Sample code</p>
                <p className="mt-1">Not a live report — tokens expire after 7 days.</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-7">
            <FileCheck2 className="h-5 w-5 text-lavender" strokeWidth={1.6} />
            <h2 className="mt-4 text-xl font-semibold">Why it holds up</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Photos hashed at upload — any later edit breaks the fingerprint.</li>
              <li>Overall report hash chains every file hash in order.</li>
              <li>Statute footer cites A.R.S. § 33-1321(C)–(E) on the page itself.</li>
              <li>Signature lines for both parties, plus e-sign with IP and timestamp.</li>
            </ul>
          </div>

          <div className="glass-panel p-7">
            <ShieldCheck className="h-5 w-5 text-lavender" strokeWidth={1.6} />
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Names, unit numbers and precise coordinates in this example are redacted. deposit is
              documentation software and does not provide legal advice.
            </p>
          </div>
        </div>
      </div>
    </Page>
  );
}

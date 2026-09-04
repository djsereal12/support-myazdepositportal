import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/site-shell";

const faqs = [
  {
    q: "How do I get my security deposit back in Arizona?",
    a: "Give your landlord written notice with a forwarding address when you move out. Under A.R.S. § 33-1321(D) they then have fourteen business days — weekends and legal holidays excluded — to return your deposit with an itemized list of any deductions. Send a dated move-out report with timestamped, GPS-tagged photos so the condition of the unit is documented before you hand back the keys.",
  },
  {
    q: "How long does a landlord have to return a deposit?",
    a: "Fourteen business days after the tenancy ends and you have supplied a forwarding address. Business days exclude Saturdays, Sundays and legal holidays, so a move-out at the start of a holiday week can push the true deadline close to three calendar weeks.",
  },
  {
    q: "What if my landlord won't return my deposit?",
    a: "Send a written demand letter citing A.R.S. § 33-1321(D) and give a deadline. If the landlord wrongfully withholds any portion, § 33-1321(E) lets you recover the amount wrongfully withheld plus damages of up to twice that amount. deposit generates an Arizona demand letter that attaches your report number, photo hashes and inspection dates.",
  },
  {
    q: "Can a landlord charge me for normal wear and tear?",
    a: "No. Arizona landlords may deduct for unpaid rent and damage beyond ordinary wear and tear, but not for the fading, minor scuffing and aging that come with normal use. A move-in report showing a mark already existed is usually the fastest way to end that argument.",
  },
  {
    q: "What is a move-in inspection report and why does it matter?",
    a: "A.R.S. § 33-1321(C) gives you the right to be present at a move-in inspection and to receive a signed list of existing damages. In deposit, a move-in report captures each room's photos with GPS coordinates, capture timestamps, device details, local weather conditions and a SHA-256 hash of every file, plus one overall hash for the whole report.",
  },
  {
    q: "How does deposit make photos tamper-proof?",
    a: "Each photo is hashed with SHA-256 at upload and stored privately. The report itself carries an overall hash derived from every media hash in order. If a single pixel or timestamp changed later, the hashes would no longer match, which is what makes the record verifiable rather than just a folder of pictures.",
  },
  {
    q: "How do I send my move-in report to a landlord who doesn't have an account?",
    a: "Open the move-in report and choose Send to Landlord for Acceptance. deposit emails a secure link to a public review page — no login required — where the landlord sees every photo, hash, GPS point and the overall report hash. The link expires after seven days.",
  },
  {
    q: "Is the landlord's electronic signature legally binding?",
    a: "Electronic signatures are generally enforceable in Arizona under the Arizona Electronic Transactions Act and the federal ESIGN Act. When a landlord accepts, they type their full legal name and confirm they intend the signature to be binding; deposit records the signature name, timestamp and originating IP address alongside the report.",
  },
  {
    q: "What happens if the landlord disputes my report?",
    a: "They can respond with dispute notes on the same public page. Those notes are stored with the invite record and shown on your report, so you have a dated written statement of exactly which items the landlord contested — useful later if a deduction appears that contradicts it.",
  },
  {
    q: "What should be on a move-out checklist?",
    a: "Walk the same rooms in the same order as your move-in report: floors, walls, ceilings, windows, doors, appliances, plumbing fixtures, HVAC filters, and the exterior or patio. Photograph meters and the final cleaned state, and capture the mailbox or unit number so the location is unambiguous.",
  },
  {
    q: "Does deposit give legal advice?",
    a: "No. deposit is documentation software. Statute summaries here are informational; for advice about your specific situation, consult a licensed Arizona attorney.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Getting your security deposit back in Arizona — FAQ | deposit" },
      {
        name: "description",
        content:
          "Answers for Arizona renters: deposit return deadlines, move-in inspection reports, wear and tear, landlord dispute notes and the e-sign flow.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:title",
        content: "Getting your security deposit back in Arizona — FAQ",
      },
      {
        property: "og:description",
        content:
          "Deadlines, move-in reports, dispute notes and landlord e-signatures, explained for Arizona renters.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Arizona security deposit FAQ" },
      {
        name: "twitter:description",
        content: "How Arizona renters document, demand and recover a security deposit.",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLd),
      },
    ],
  }),
  component: Faq,
});

function Faq() {
  return (
    <Page>
      <section className="rounded-3xl border border-border lavender-wash px-6 py-14 shadow-lift sm:px-12">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-lavender-deep">
          Tenant FAQ
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Getting your deposit back, {" "}
          <span className="font-script text-5xl font-normal holo-text">
            without the guesswork.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Arizona deadlines, move-in documentation, dispute notes and landlord e-signatures —
          answered in plain language for renters.
        </p>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {faqs.map((f) => (
          <article key={f.q} className="glass-panel p-8">
            <h2 className="text-lg font-semibold leading-snug">{f.q}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 glass-panel flex flex-col gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Start your move-in report</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Timestamped, GPS-tagged, hash-verified — and sendable to your landlord for signature.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/auth"
            className="rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Create a report
          </Link>
          <Link
            to="/law"
            className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            Read the statute
          </Link>
        </div>
      </section>

      <p className="mt-8 text-xs text-muted-foreground">
        deposit is documentation software and does not provide legal advice. Consult a licensed
        Arizona attorney for your specific situation.
      </p>
    </Page>
  );
}

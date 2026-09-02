import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Scale, Database, Lock, Mail } from "lucide-react";
import { Page } from "@/components/site-shell";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal disclaimer & privacy policy — DEPOSIT" },
      {
        name: "description",
        content:
          "How DEPOSIT handles Arizona landlord-tenant documentation, what it is not (legal advice), and exactly how your photos, hashes and report data are stored and shared.",
      },
      { property: "og:title", content: "Legal disclaimer & privacy policy — DEPOSIT" },
      {
        property: "og:description",
        content:
          "Arizona A.R.S. § 33-1321 context, evidence limits, and our data storage, retention and sharing practices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Legal,
});

const updated = "September 2, 2026";

function Legal() {
  return (
    <Page>
      <header className="rounded-3xl border border-border lavender-wash px-6 py-14 shadow-lift sm:px-12">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Disclaimer & privacy
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          What DEPOSIT is, what it{" "}
          <span className="font-script text-5xl font-normal text-lavender-deep">isn't</span>, and
          where your evidence lives.
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Last updated {updated}. This page covers both our legal disclaimer regarding Arizona
          landlord-tenant law and our privacy practices for the photos, videos and metadata you
          capture.
        </p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2 text-xs">
        {[
          ["#disclaimer", "Legal disclaimer"],
          ["#arizona", "Arizona law"],
          ["#evidence", "Evidence & admissibility"],
          ["#privacy", "Privacy policy"],
          ["#storage", "How reports are stored"],
          ["#sharing", "Sharing & landlords"],
          ["#retention", "Retention & deletion"],
          ["#contact", "Contact"],
        ].map(([href, label]) => (
          <a
            key={href}
            href={href}
            className="rounded-full border border-border bg-card px-4 py-2 transition-colors hover:bg-accent"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-6 grid gap-5">
        <Section id="disclaimer" icon={Scale} title="Legal disclaimer">
          <p>
            DEPOSIT is documentation software. It is <strong>not a law firm</strong>, does not
            provide legal advice, and using it does not create an attorney-client relationship. The
            statutory references, deadlines and letter templates in the product are general
            information about Arizona law and are not a substitute for advice from a licensed
            Arizona attorney about your specific tenancy.
          </p>
          <p>
            Demand letters, response letters and comparison flags are generated from the facts and
            amounts <em>you</em> enter. We do not review them for accuracy, do not verify claims of
            damage, and do not guarantee that sending a letter will recover any portion of a
            security deposit. Outcomes depend on your lease, your evidence, and the court or party
            evaluating it.
          </p>
          <p>
            DEPOSIT is designed for residential tenancies in Arizona governed by the Arizona
            Residential Landlord and Tenant Act. Mobile home parks, commercial leases, and tenancies
            outside Arizona are governed by different statutes and deadlines; the timelines this app
            computes may not apply to them.
          </p>
        </Section>

        <Section id="arizona" icon={Scale} title="Arizona landlord-tenant law">
          <p>
            The provisions DEPOSIT references most often, all within{" "}
            <a
              className="underline underline-offset-4"
              href="https://www.azleg.gov/ars/33/01321.htm"
              target="_blank"
              rel="noopener noreferrer"
            >
              A.R.S. § 33-1321
            </a>
            :
          </p>
          <ul className="mt-3 space-y-3">
            <li>
              <strong>§ 33-1321(C)</strong> — a tenant is entitled to be present at a move-in
              inspection and to receive a signed, itemized statement of existing damages. Move-in
              reports in DEPOSIT are built to serve as that record.
            </li>
            <li>
              <strong>§ 33-1321(D)</strong> — after the tenancy ends and the tenant provides a
              forwarding address, the landlord has <strong>fourteen business days</strong>{" "}
              (excluding Saturdays, Sundays and legal holidays) to return the deposit along with an
              itemized list of deductions.
            </li>
            <li>
              <strong>§ 33-1321(E)</strong> — where a landlord wrongfully withholds, a tenant may
              recover up to <strong>twice the amount</strong> wrongfully withheld.
            </li>
          </ul>
          <p className="mt-3">
            Deadline math in the app is an estimate. Holiday observance, mailing rules, lease terms
            and the date your forwarding address was actually delivered can all move the date.
            Verify the statute text and confirm your own dates before relying on them. Read our
            plain-language summary on the{" "}
            <Link to="/law" className="underline underline-offset-4">
              Arizona law
            </Link>{" "}
            page.
          </p>
        </Section>

        <Section id="evidence" icon={ShieldCheck} title="Evidence & admissibility">
          <p>
            Every media file you upload is hashed with SHA-256 at capture time, and a report-level
            hash is computed from all of its file hashes when the report is sealed. This makes
            tampering detectable: if a file changes after sealing, its hash no longer matches the
            sealed record.
          </p>
          <p>
            Hashing demonstrates integrity — that a file has not changed since it was recorded. It
            does not, by itself, prove when or where a photo was originally taken, who took it, or
            what a room looked like before you arrived. GPS coordinates, timestamps, device model
            and weather are captured from your browser and device and are only as accurate as those
            sources.
          </p>
          <p>
            We make no representation that a DEPOSIT report will be admitted as evidence in any
            proceeding. Admissibility is decided by the court.
          </p>
        </Section>

        <Section id="privacy" icon={Lock} title="Privacy policy">
          <p>We collect only what the product needs to function:</p>
          <ul className="mt-3 space-y-2">
            <li>
              <strong>Account data</strong> — email address and, if you provide it, your full name,
              via our authentication provider.
            </li>
            <li>
              <strong>Property and report data</strong> — address, unit, lease dates, deposit
              amount, landlord name and landlord email that you enter.
            </li>
            <li>
              <strong>Media and capture metadata</strong> — photos and videos, plus GPS
              latitude/longitude, capture timestamp, device model string, a weather snapshot, room
              label, condition rating, your notes, and the SHA-256 hash of each file.
            </li>
            <li>
              <strong>Payment data</strong> — purchases are processed by Stripe. We never see or
              store your card number. We keep the checkout session id, product purchased, amount and
              status so we can unlock what you paid for.
            </li>
          </ul>
          <p className="mt-3">
            We do not sell your data, and we do not use your photos to train models or share them
            with advertisers.
          </p>
        </Section>

        <Section id="storage" icon={Database} title="How reports are stored">
          <p>
            Media files are uploaded to a <strong>private</strong> storage bucket — there is no
            public URL for your photos. Images are served through short-lived signed links generated
            only for a signed-in account that is allowed to view that report.
          </p>
          <p>
            Report rows, media metadata, disputes, letters and purchases live in a Postgres database
            with row-level security enabled on every table. Access rules are enforced by the
            database itself, not just by the app: by default a row is readable only by the account
            that owns it.
          </p>
          <p>
            Data is encrypted in transit (HTTPS/TLS) and at rest by our infrastructure provider.
            Once a report is sealed, its media hashes and overall hash are treated as immutable
            records — we do not edit them, and neither can you, which is the point.
          </p>
        </Section>

        <Section id="sharing" icon={Mail} title="Sharing with landlords and others">
          <p>A landlord can see a report only when one of these is true:</p>
          <ul className="mt-3 space-y-2">
            <li>
              You listed their email address as the landlord contact on the property, or you shared
              the report with that email address from the report page; and
            </li>
            <li>they sign in to DEPOSIT with that same email address.</li>
          </ul>
          <p className="mt-3">
            Their access is read-only for your report and its media. They can file a dispute or
            write a response letter, both of which become visible to you. You can remove a share you
            created at any time. Public verification links only confirm a report number and its
            integrity hash — they do not expose your photos, notes, or address details.
          </p>
          <p>
            We disclose data to third parties only in these cases: our infrastructure and payment
            processors acting on our behalf, when you direct us to share it, or when required by
            valid legal process.
          </p>
        </Section>

        <Section id="retention" icon={Database} title="Retention, deletion and your rights">
          <p>
            We keep your reports for as long as your account exists, because deposit disputes can
            surface long after move-out. You can delete a property, report or share from within the
            app; deleting a report deletes its media files and metadata. Deleting your account
            removes your reports, media and shares.
          </p>
          <p>
            Purchase records may be retained after deletion where we are required to keep them for
            tax and accounting purposes. You may request a copy of your data or its deletion by
            contacting us.
          </p>
          <p>
            DEPOSIT is not intended for anyone under 18. Cookies and local storage are used only to
            keep you signed in — we do not run third-party advertising trackers.
          </p>
        </Section>

        <Section id="contact" icon={Mail} title="Contact and changes">
          <p>
            Questions about this page, a data request, or a correction: reach us through the account
            email you signed up with and we will respond to the request.
          </p>
          <p>
            We may update this page as the product changes. The "last updated" date at the top always
            reflects the current version, and material changes will be surfaced in the app.
          </p>
        </Section>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Nothing on this page is legal advice. For advice about your tenancy, consult a licensed
        Arizona attorney or contact the Arizona Attorney General's office.
      </p>
    </Page>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: typeof Scale;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="glass-panel scroll-mt-24 p-8 sm:p-10">
      <div className="flex items-center gap-2.5">
        <Icon className="h-5 w-5 text-lavender" strokeWidth={1.5} />
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

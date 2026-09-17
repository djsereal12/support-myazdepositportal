import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/site-shell";

const TITLE = "Arizona Security Deposit Demand Letter: Free Guide + Template";
const DESCRIPTION =
  "How to write an Arizona security deposit demand letter under A.R.S. § 33-1321, what to include, the 14 business day deadline, and a template you can send today.";
const URL = "https://www.myazdepositportal.live/demand-letter";

export const Route = createFileRoute("/demand-letter")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          mainEntityOfPage: URL,
        }),
      },
    ],
  }),
  component: DemandLetterGuide;
});

const steps = [
  {
    step: "1",
    title: "Give a written forwarding address",
    body: "The 14 business day clock in A.R.S. § 33-1321(D) starts once the tenancy ends and you have given the landlord a forwarding address in writing. Keep a dated copy — email works and timestamps itself.",
  },
  {
    step: "2",
    title: "Count 14 business days, not calendar days",
    body: "Weekends and legal holidays do not count. If the deposit and an itemized list of deductions have not arrived by that deadline, the withholding is late and your demand letter is due.",
  },
  {
    step: "3",
    title: "State the amount and the evidence",
    body: "Name the deposit paid, the amount withheld, and why each deduction is wrong. Attach move-in and move-out photo documentation with timestamps so the landlord can see exactly what they would face in court.",
  },
  {
    step: "4",
    title: "Ask for the statutory remedy",
    body: "Under § 33-1321(E) a tenant may recover the amount wrongfully withheld plus damages of up to twice that amount. Say so plainly, give a response deadline (10 days is common), and note that you will file in justice court otherwise.",
  },
];

const includes = [
  "Your full name, the rental address, and the unit number",
  "Move-in and move-out dates",
  "The deposit amount paid and the amount returned, if any",
  "The written forwarding address you provided and the date you sent it",
  "An itemized response to each deduction the landlord claimed",
  "A reference to A.R.S. § 33-1321 and the 14 business day deadline",
  "The total you are demanding and a clear payment deadline",
  "Attached, dated photo evidence of the unit's condition",
];

function DemandLetterGuide() {
  return (
    <Page>
      <section className="rounded-3xl border border-border lavender-wash px-6 py-14 shadow-lift sm:px-12">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Arizona renters
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Arizona security deposit{" "}
          <span className="font-script text-5xl font-normal holo-text">demand letter</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          A demand letter is the last step before small claims court — and usually the step that
          gets a deposit returned. Here is exactly what an Arizona demand letter needs, when to send
          it, and how to back it with evidence a landlord cannot argue with.
        </p>
      </section>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {steps.map((s) => (
          <article key={s.step} className="glass-panel p-8">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-lavender-deep">
              Step {s.step}
            </p>
            <h2 className="mt-4 text-xl font-semibold">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </article>
        ))}
      </div>

      <section className="glass-panel mt-8 p-8">
        <h2 className="text-2xl font-semibold">What to include in the letter</h2>
        <ul className="mt-5 grid gap-2.5 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
          {includes.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-lavender-deep">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-panel mt-8 p-8">
        <h2 className="text-2xl font-semibold">Template you can adapt</h2>
        <pre className="mt-5 whitespace-pre-wrap rounded-2xl border border-border bg-background/60 p-6 text-sm leading-relaxed text-muted-foreground">{`[Date]

[Landlord name]
[Landlord address]

Re: Return of security deposit — [rental address, unit]

Dear [Landlord name],

My tenancy at [rental address] ended on [move-out date]. On [date] I
provided my forwarding address in writing at [forwarding address].

Under A.R.S. § 33-1321(D), the security deposit of $[amount] and an
itemized list of any deductions were due within fourteen business days
of that date. To date I have received $[amount returned].

The deductions claimed are not supported by the condition of the unit.
Attached is dated photographic documentation of the unit at move-in and
at move-out.

I am requesting the return of $[amount withheld] within 10 days of the
date of this letter. If it is not returned, I intend to pursue the
remedies available under A.R.S. § 33-1321(E), which allow recovery of
the amount wrongfully withheld plus damages of up to twice that amount.

Sincerely,
[Your name]
[Phone] · [Email]`}</pre>
      </section>

      <section className="glass-panel mt-8 p-8">
        <h2 className="text-2xl font-semibold">Let deposit write and send it for you</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          deposit generates the letter from your sealed move-in and move-out record, attaches the
          tamper-proof hash of your photo evidence, and emails it to your landlord with a
          verification link they can check themselves.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/pricing"
            className="glass-button inline-flex rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            Generate my demand letter
          </Link>
          <Link
            to="/law"
            className="inline-flex rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-lavender"
          >
            Read the Arizona law
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

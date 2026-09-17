import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/site-shell";

export const Route = createFileRoute("/law")({
  head: () => ({
    meta: [
      { title: "Arizona deposit law — A.R.S. § 33-1321 | deposit" },
      {
        name: "description",
        content:
          "A plain-language guide to A.R.S. § 33-1321: move-in inspections, the 14 business day return deadline, and double-damages recovery.",
      },
      { property: "og:title", content: "Arizona deposit law — A.R.S. § 33-1321" },
      {
        property: "og:description",
        content: "What Arizona renters are owed and how quickly landlords must return a deposit.",
      },
    ],
  }),
  component: Law,
});

const sections = [
  {
    cite: "§ 33-1321(C)",
    title: "Move-in inspection right",
    body: "You are entitled to be present at a move-in inspection and to receive a signed, itemized list of existing damages. Documentation you create at move-in is the baseline every later charge is measured against.",
  },
  {
    cite: "§ 33-1321(D)",
    title: "14 business days to return",
    body: "After the tenancy ends and you give a forwarding address, the landlord has fourteen business days — weekends and legal holidays excluded — to return the deposit along with an itemized list of any deductions.",
  },
  {
    cite: "§ 33-1321(E)",
    title: "Up to double damages",
    body: "If the landlord wrongfully withholds any portion, you may recover the property or money wrongfully withheld plus damages of up to twice the amount wrongfully withheld.",
  },
];

function Law() {
  return (
    <Page>
      <section className="rounded-3xl border border-border lavender-wash px-6 py-14 shadow-lift sm:px-12">
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Arizona already wrote the rules. Most renters just can't{" "}
          <span className="font-script text-5xl font-normal holo-text">prove it.</span>
        </h1>
      </section>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {sections.map((s) => (
          <article key={s.cite} className="glass-panel p-8">
            <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-lavender-deep">
              {s.cite}
            </p>
            <h2 className="mt-4 text-xl font-semibold">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </article>
        ))}
      </div>
      <div className="glass-panel mt-8 p-8">
        <h2 className="text-xl font-semibold">Deposit already late?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Read our guide to writing an Arizona security deposit demand letter, including a template
          you can adapt today.
        </p>
        <Link
          to="/demand-letter"
          className="glass-button mt-5 inline-flex rounded-xl px-5 py-2.5 text-sm font-medium"
        >
          Demand letter guide
        </Link>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        deposit is documentation software and does not provide legal advice. Consult a licensed
        Arizona attorney for your specific situation.
      </p>
    </Page>
  );
}

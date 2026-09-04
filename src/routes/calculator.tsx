import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Page } from "@/components/site-shell";
import { businessDaysFrom, money } from "@/lib/deposit";
import { CalendarClock, Scale, FileText } from "lucide-react";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Arizona deposit deadline & 2x claim calculator | deposit" },
      {
        name: "description",
        content:
          "Enter your move-out date and deposit amount to see the 14-business-day A.R.S. § 33-1321(D) deadline and the maximum you can claim under § 33-1321(E).",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Arizona security deposit deadline calculator" },
      {
        property: "og:description",
        content:
          "14 business days, weekends skipped — plus your maximum 2x recovery under Arizona law.",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Arizona security deposit deadline calculator" },
      {
        name: "twitter:description",
        content: "Deadline date and maximum claim under A.R.S. § 33-1321.",
      },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const [moveOut, setMoveOut] = useState("");
  const [amount, setAmount] = useState("");

  const result = useMemo(() => {
    if (!moveOut) return null;
    const [y, m, d] = moveOut.split("-").map(Number);
    if (!y || !m || !d) return null;
    const start = new Date(y, m - 1, d);
    const deadline = businessDaysFrom(start, 14);
    const deposit = Number(amount) || 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((deadline.getTime() - today.getTime()) / 86400000);
    return {
      deadline,
      deposit,
      maxClaim: deposit * 3,
      penalty: deposit * 2,
      overdue: daysLeft < 0,
      daysLeft,
    };
  }, [moveOut, amount]);

  return (
    <Page>
      <section className="rounded-3xl border border-border lavender-wash px-6 py-12 shadow-lift sm:px-12">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          A.R.S. § 33-1321(D) &amp; (E)
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Find out what your landlord{" "}
          <span className="font-script text-5xl font-normal holo-text">actually owes you.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Fourteen business days, weekends skipped. Withhold wrongfully and Arizona lets you recover
          the amount plus damages of up to twice that amount.
        </p>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-8">
          <CalendarClock className="h-5 w-5 text-lavender" strokeWidth={1.6} />
          <h2 className="mt-4 text-xl font-semibold">Your numbers</h2>
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Move-out date
              </span>
              <input
                type="date"
                value={moveOut}
                onChange={(e) => setMoveOut(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Deposit amount (USD)
              </span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="1800"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-foreground/30"
              />
            </label>
            <p className="text-xs text-muted-foreground">
              The clock starts when the tenancy ends and the landlord has your written forwarding
              address. Legal holidays can push the true deadline out further.
            </p>
          </div>
        </div>

        <div className="glass-panel flex flex-col justify-between p-8">
          <div>
            <Scale className="h-5 w-5 text-lavender" strokeWidth={1.6} />
            <h2 className="mt-4 text-xl font-semibold">Your leverage</h2>
            {result ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-border bg-card/70 p-4">
                  <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Return deadline
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {result.deadline.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.overdue
                      ? `Overdue by ${Math.abs(result.daysLeft)} day${Math.abs(result.daysLeft) === 1 ? "" : "s"}.`
                      : `${result.daysLeft} day${result.daysLeft === 1 ? "" : "s"} to go.`}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card/70 p-4">
                    <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                      Deposit
                    </p>
                    <p className="mt-1 text-lg font-semibold">{money(result.deposit)}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card/70 p-4">
                    <p className="text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
                      Max claim
                    </p>
                    <p className="mt-1 text-lg font-semibold holo-text">{money(result.maxClaim)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {money(result.deposit)} withheld + up to {money(result.penalty)} damages.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                Enter a move-out date to see your deadline and maximum claim.
              </p>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" className="btn-glass-pink px-5 py-2.5 text-sm font-medium">
              <FileText className="h-4 w-4" /> Generate demand letter
            </Link>
            <Link to="/law" className="btn-glass px-5 py-2.5 text-sm font-medium">
              Read the statute
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Estimates only. Business-day counts here skip weekends but not Arizona legal holidays.
        deposit is documentation software and does not provide legal advice.
      </p>
    </Page>
  );
}

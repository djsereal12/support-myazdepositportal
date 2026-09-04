import { createFileRoute, Link } from "@tanstack/react-router";
import { Page } from "@/components/site-shell";
import { AskChat } from "@/components/ask-chat";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask about your Arizona deposit — deposit" },
      {
        name: "description",
        content:
          "Free Q&A on Arizona security deposit rules, the 14 business day deadline, wear and tear, and how to document your move-in with deposit.",
      },
      { property: "og:title", content: "Ask about your Arizona deposit" },
      {
        property: "og:description",
        content:
          "Instant answers on A.R.S. §33-1321, deposit deadlines, and getting your deposit back in Arizona.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AskPage,
});

function AskPage() {
  return (
    <Page>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ask deposit</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Questions about your Arizona deposit?
        </h1>
        <p className="mt-3 text-muted-foreground">
          Ask about the 14 business day deadline, wear and tear, dispute notes, or how to seal and
          send a report. For the written version, see the{" "}
          <Link to="/faq" className="underline underline-offset-4">
            tenant FAQ
          </Link>{" "}
          and{" "}
          <Link to="/law" className="underline underline-offset-4">
            Arizona law
          </Link>{" "}
          pages.
        </p>

        <div className="glass mt-8 flex h-[32rem] flex-col rounded-3xl p-5">
          <AskChat className="min-h-0 flex-1" />
        </div>
      </div>
    </Page>
  );
}

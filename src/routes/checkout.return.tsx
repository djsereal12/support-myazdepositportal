import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Page } from "@/components/site-shell";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({
    meta: [
      { title: "Payment complete — deposit" },
      { name: "description", content: "Your deposit purchase is confirmed and unlocked." },
      { property: "og:title", content: "Payment complete — deposit" },
      { property: "og:description", content: "Your deposit purchase is confirmed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { session_id?: string } =>
    typeof search["session_id"] === "string" ? { session_id: search["session_id"] } : {},
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();

  return (
    <Page>
      <div className="glass-panel mx-auto max-w-lg p-10 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-lavender" strokeWidth={1.5} />
        <h1 className="mt-5 text-3xl font-semibold">
          {sessionId ? "Payment received" : "No payment found"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {sessionId
            ? "Your purchase is confirmed. It can take a few seconds for the unlock to appear on your report."
            : "We couldn't find a checkout session for this visit."}
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </Page>
  );
}

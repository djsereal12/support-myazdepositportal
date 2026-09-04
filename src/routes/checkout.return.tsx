import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { Page } from "@/components/site-shell";
import { applyPurchaseToNextReport, type ApplyResult } from "@/utils/purchase-apply.functions";

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
  const apply = useServerFn(applyPurchaseToNextReport);
  const [result, setResult] = useState<ApplyResult | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setWorking(true);
    // The payment webhook records the purchase a moment after the redirect,
    // so retry briefly before giving up.
    (async () => {
      for (let attempt = 0; attempt < 5 && !cancelled; attempt++) {
        try {
          const res = await apply({ data: { origin: window.location.origin } });
          if (cancelled) return;
          if (res.applied > 0 || attempt === 4) {
            setResult(res);
            setWorking(false);
            return;
          }
        } catch (e) {
          if (attempt === 4) {
            setError(e instanceof Error ? e.message : "Could not apply your purchase.");
            setWorking(false);
            return;
          }
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) setWorking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, apply]);

  return (
    <Page>
      <div className="glass-panel mx-auto max-w-lg p-10 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-lavender" strokeWidth={1.5} />
        <h1 className="mt-5 text-3xl font-semibold">
          {sessionId ? "Payment received" : "No payment found"}
        </h1>

        {!sessionId ? (
          <p className="mt-3 text-sm text-muted-foreground">
            We couldn&apos;t find a checkout session for this visit.
          </p>
        ) : working ? (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Unlocking your report and notifying your
            landlord…
          </p>
        ) : error ? (
          <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        ) : result ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{result.message}</p>
            {result.landlordEmailSent ? (
              <p className="flex items-center justify-center gap-2 text-sm text-foreground">
                <Mail className="h-4 w-4 text-lavender" /> Sent to {result.landlordEmail}
              </p>
            ) : null}
            {result.address ? (
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {result.address}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Your purchase is confirmed. It can take a few seconds for the unlock to appear on your
            report.
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {result?.reportId ? (
            <Link
              to="/reports/$reportId"
              params={{ reportId: result.reportId }}
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
            >
              Open unlocked report
            </Link>
          ) : null}
          <Link
            to="/dashboard"
            className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </Page>
  );
}

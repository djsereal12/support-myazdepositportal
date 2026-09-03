import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { unsubscribeWithToken } from "@/utils/unsubscribe.functions";
import { Page } from "@/components/site-shell";

export const Route = createFileRoute("/unsubscribe")({
  component: UnsubscribePage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search['token'] === "string" ? (search['token'] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Unsubscribe — deposit" },
      {
        name: "description",
        content:
          "Stop receiving Arizona deposit tips and product updates from deposit. Your account and reports are unaffected.",
      },
      { property: "og:title", content: "Unsubscribe — deposit" },
      {
        property: "og:description",
        content: "Stop receiving marketing email from deposit. Your reports stay untouched.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const run = useServerFn(unsubscribeWithToken);
  const [state, setState] = useState<"working" | "done" | "invalid">("working");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!token) {
      setState("invalid");
      return;
    }
    run({ data: { token } })
      .then((res) => {
        if (!active) return;
        setEmail(res.email);
        setState(res.ok ? "done" : "invalid");
      })
      .catch(() => active && setState("invalid"));
    return () => {
      active = false;
    };
  }, [token, run]);

  return (
    <Page>
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-20">
        <div className="rounded-2xl border border-border bg-card/70 p-8 shadow-sm backdrop-blur">
          <h1 className="font-display text-3xl tracking-tight">
            {state === "working"
              ? "Updating your preferences…"
              : state === "done"
                ? "You're unsubscribed"
                : "This link isn't valid"}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {state === "working" &&
              "One moment while we remove you from the deposit mailing list."}
            {state === "done" &&
              `${email ?? "That address"} will no longer receive marketing email from deposit. Account, report and landlord notifications are unaffected.`}
            {state === "invalid" &&
              "The unsubscribe link is incomplete or expired. Reply to any deposit email and we'll remove you manually."}
          </p>
          <a
            href="/"
            className="mt-8 inline-flex rounded-xl border border-border bg-background/60 px-5 py-2.5 text-sm font-medium transition hover:bg-background"
          >
            Back to deposit
          </a>
        </div>
      </div>
    </Page>
  );
}

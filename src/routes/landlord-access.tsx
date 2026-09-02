import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Page } from "@/components/site-shell";
import { formatDate, shortHash, REPORT_TYPE_LABEL } from "@/lib/deposit";
import {
  getLandlordPortal,
  postLandlordReply,
  respondToInvite,
  type PortalInvite,
} from "@/utils/invites.functions";
import { ShieldCheck, AlertTriangle, CheckCircle2, KeyRound, MessageSquare } from "lucide-react";

const STORAGE_KEY = "deposit.landlord.token";

export const Route = createFileRoute("/landlord-access")({
  head: () => ({
    meta: [
      { title: "Landlord portal — review, reply and accept | deposit" },
      {
        name: "description",
        content:
          "Landlords: open every move-in report a tenant sent you, reply to disputes and confirm acceptance with an e-signature — no account required.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://myazdepositportal.live/landlord-access" },
      { property: "og:title", content: "Landlord portal — review, reply and accept" },
      {
        property: "og:description",
        content: "Review disputed Arizona move-in reports and respond without signing up.",
      },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://myazdepositportal.live/landlord-access" }],
  }),
  component: LandlordAccess,
});

function extractToken(raw: string): string {
  const value = raw.trim();
  const match = value.match(/verify\/([A-Za-z0-9]+)/);
  return (match?.[1] ?? value).trim();
}

function LandlordAccess() {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "disputed" | "accepted">("all");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setToken(saved);
      setInput(saved);
    }
  }, []);

  const portal = useQuery({
    queryKey: ["landlord-portal", token],
    queryFn: () => getLandlordPortal({ data: { token } }),
    enabled: token.length > 0,
  });

  const invites = portal.data?.ok ? portal.data.invites : [];
  const counts = useMemo(
    () => ({
      all: invites.length,
      pending: invites.filter((i) => i.status === "pending").length,
      disputed: invites.filter((i) => i.status === "disputed").length,
      accepted: invites.filter((i) => i.status === "accepted").length,
    }),
    [invites],
  );
  const visible = filter === "all" ? invites : invites.filter((i) => i.status === filter);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = extractToken(input);
    if (!next) {
      toast.error("Paste the review link or access code from your email.");
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, next);
    setToken(next);
  }

  return (
    <Page>
      <section className="rounded-3xl border border-border lavender-wash px-6 py-14 shadow-lift sm:px-12">
        <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-lavender-deep">
          Landlord portal
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Review, reply and accept —{" "}
          <span className="font-script text-5xl font-normal text-lavender-deep">no account.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Paste the secure review link a tenant emailed you. It opens every report sent to your
          email address, including anything you already disputed.
        </p>

        <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <KeyRound
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.5}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your review link or access code"
              className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition-colors focus:border-lavender"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-primary px-6 py-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open my reports
          </button>
        </form>
      </section>

      {token && portal.isLoading ? (
        <div className="glass-panel mt-8 p-10 text-center text-sm text-muted-foreground">
          Loading your reports…
        </div>
      ) : null}

      {token && portal.data && !portal.data.ok ? (
        <div className="glass-panel mt-8 p-10 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-lavender" strokeWidth={1.5} />
          <h2 className="mt-5 text-xl font-semibold">We couldn't match that code</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Check the link in the tenant's email, or ask them to resend the request.
          </p>
        </div>
      ) : null}

      {portal.data?.ok ? (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Signed in by link as{" "}
              <span className="font-medium text-foreground">{portal.data.landlordEmail}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "disputed", "accepted"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium capitalize transition-colors ${
                    filter === key
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  {key} ({counts[key]})
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4">
            {visible.length === 0 ? (
              <div className="glass-panel p-10 text-center text-sm text-muted-foreground">
                Nothing here yet.
              </div>
            ) : (
              visible.map((invite) => (
                <InviteCard
                  key={invite.token}
                  invite={invite}
                  onChanged={() => portal.refetch()}
                />
              ))
            )}
          </div>
        </>
      ) : null}

      <p className="mt-8 text-xs text-muted-foreground">
        Have an account?{" "}
        <Link to="/landlord" className="underline underline-offset-4 hover:text-foreground">
          Sign in to the full landlord portal
        </Link>
        . deposit is documentation software and does not provide legal advice.
      </p>
    </Page>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  accepted: "bg-lavender-soft text-lavender-deep",
  disputed: "bg-amber-100 text-amber-800",
  expired: "bg-muted text-muted-foreground",
};

function InviteCard({ invite, onChanged }: { invite: PortalInvite; onChanged: () => void }) {
  const [reply, setReply] = useState("");
  const [signature, setSignature] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showAccept, setShowAccept] = useState(false);

  const sendReply = useMutation({
    mutationFn: () => postLandlordReply({ data: { token: invite.token, body: reply } }),
    onSuccess: () => {
      setReply("");
      toast.success("Reply sent to the tenant.");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accept = useMutation({
    mutationFn: () =>
      respondToInvite({
        data: { token: invite.token, action: "accepted", signatureName: signature },
      }),
    onSuccess: () => {
      toast.success("Acceptance recorded.");
      setShowAccept(false);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <article className="glass-panel p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-lavender-deep">
            {invite.report_number} ·{" "}
            {REPORT_TYPE_LABEL[invite.report_type as keyof typeof REPORT_TYPE_LABEL] ??
              invite.report_type}
          </p>
          <h2 className="mt-3 text-xl font-semibold">
            {invite.address}
            {invite.unit ? ` ${invite.unit}` : ""}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {invite.tenant_name ? `Tenant ${invite.tenant_name} · ` : ""}
            Documented {formatDate(invite.report_created_at)}
            {invite.overall_hash ? ` · hash ${shortHash(invite.overall_hash)}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[0.68rem] font-medium capitalize ${
            STATUS_STYLE[invite.status] ?? STATUS_STYLE["pending"]
          }`}
        >
          {invite.status}
        </span>
      </div>

      {invite.response_note ? (
        <div className="mt-6 rounded-2xl border border-border bg-card/70 p-5">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Your dispute note · {invite.responded_at ? formatDate(invite.responded_at) : ""}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{invite.response_note}</p>
        </div>
      ) : null}

      {invite.response_signature_name ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-lavender-deep">
          <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
          Accepted and e-signed by {invite.response_signature_name}
          {invite.responded_at ? ` on ${formatDate(invite.responded_at)}` : ""}
        </p>
      ) : null}

      {invite.messages.length > 0 ? (
        <div className="mt-6 space-y-3">
          {invite.messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl border border-border p-4 text-sm ${
                m.author_role === "landlord" ? "bg-lavender-soft/40" : "bg-card/70"
              }`}
            >
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                {m.author_role === "landlord" ? "You" : "Tenant"}
                {m.author_name ? ` · ${m.author_name}` : ""} · {formatDate(m.created_at)}
              </p>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <label className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          <MessageSquare className="mr-2 inline h-3.5 w-3.5" strokeWidth={1.5} />
          Reply to this report
        </label>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          placeholder="Add context, corrections or a resolution offer. The tenant sees this on their report."
          className="w-full rounded-2xl border border-border bg-card p-4 text-sm outline-none transition-colors focus:border-lavender"
        />
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => sendReply.mutate()}
            disabled={sendReply.isPending}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            {sendReply.isPending ? "Sending…" : "Send reply"}
          </button>
          <a
            href={`/verify/${invite.token}`}
            className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            View full report & photos
          </a>
          {invite.status !== "accepted" ? (
            <button
              onClick={() => setShowAccept((v) => !v)}
              className="rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Confirm acceptance
            </button>
          ) : null}
        </div>
      </div>

      {showAccept && invite.status !== "accepted" ? (
        <div className="mt-6 rounded-2xl border border-border bg-card/70 p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-lavender-deep" strokeWidth={1.5} />
            E-sign this report as accurate
          </p>
          <input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full legal name"
            className="mt-4 w-full rounded-full border border-border bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-lavender"
          />
          <label className="mt-4 flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            I agree this electronic signature is legally binding under the Arizona Electronic
            Transactions Act and the federal ESIGN Act.
          </label>
          <button
            onClick={() => accept.mutate()}
            disabled={!agreed || signature.trim().length < 2 || accept.isPending}
            className="mt-4 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {accept.isPending ? "Recording…" : "Accept & e-sign"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Page } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, shortHash, REPORT_TYPE_LABEL } from "@/lib/deposit";
import { getInviteByToken, respondToInvite, type InviteView } from "@/utils/invites.functions";
import { ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/verify/$token")({
  head: () => ({
    meta: [
      { title: "Review & e-sign a move-in report — deposit" },
      {
        name: "description",
        content:
          "Review a timestamped, hashed Arizona move-in inspection report and accept or dispute it — no account required.",
      },
      { property: "og:title", content: "Review & e-sign a move-in report — deposit" },
      {
        property: "og:description",
        content: "A legally verifiable move-in report per A.R.S. § 33-1321.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { token } = Route.useParams();

  const invite = useQuery({
    queryKey: ["invite", token],
    queryFn: () => getInviteByToken({ data: { token } }),
  });

  if (invite.isLoading) {
    return (
      <Page>
        <div className="glass-panel mx-auto max-w-xl p-10 text-center text-sm text-muted-foreground">
          Loading the report…
        </div>
      </Page>
    );
  }

  if (invite.data?.ok) {
    return <InviteReport token={token} invite={invite.data.invite} onDone={() => invite.refetch()} />;
  }

  if (invite.data && !invite.data.ok && invite.data.reason === "expired") {
    return (
      <Page>
        <div className="glass-panel mx-auto max-w-xl p-10 text-center">
          <AlertTriangle className="mx-auto h-7 w-7 text-lavender" strokeWidth={1.5} />
          <h1 className="mt-5 text-2xl font-semibold">This link has expired</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Review links stay live for 7 days. Ask the tenant to send a fresh request.
          </p>
        </div>
      </Page>
    );
  }

  return <SealLookup id={token} />;
}

/* ---------------- Invite (e-sign) view ---------------- */

function InviteReport({
  token,
  invite,
  onDone,
}: {
  token: string;
  invite: InviteView;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<null | "accept" | "dispute">(null);
  const [signature, setSignature] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [note, setNote] = useState("");

  const respond = useMutation({
    mutationFn: (vars: { action: "accepted" | "disputed" }) =>
      respondToInvite({
        data: {
          token,
          action: vars.action,
          signatureName: signature,
          note,
        },
      }),
    onSuccess: (res) => {
      toast.success(res.status === "accepted" ? "Report accepted and e-signed." : "Dispute submitted.");
      setMode(null);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const address = `${invite.property?.address ?? ""}${invite.property?.unit ? ` · ${invite.property.unit}` : ""}`;
  const responded = invite.status !== "pending";

  return (
    <Page>
      <div className="rounded-2xl border border-lavender/40 bg-lavender-soft px-6 py-4 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4 text-lavender-deep" strokeWidth={1.5} />
          This is a legally verifiable move-in report per A.R.S. § 33-1321
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Every photo carries a capture timestamp, GPS coordinates and a SHA-256 fingerprint. Any
          later edit changes the fingerprint.
        </p>
      </div>

      <article className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-soft sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="font-script text-3xl text-lavender-deep">deposit</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              {REPORT_TYPE_LABEL[invite.report.type] ?? "Move-In"} Condition Report
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{address}</p>
            {invite.tenant_name ? (
              <p className="mt-1 text-sm text-muted-foreground">Tenant: {invite.tenant_name}</p>
            ) : null}
          </div>
          <dl className="grid gap-2 text-right text-xs">
            <div>
              <dt className="uppercase tracking-[0.18em] text-muted-foreground">Report no.</dt>
              <dd className="font-mono text-sm">{invite.report.report_number}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.18em] text-muted-foreground">Created</dt>
              <dd className="text-sm">{formatDate(invite.report.created_at)}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.18em] text-muted-foreground">Conditions</dt>
              <dd className="text-sm">{invite.report.weather_snapshot ?? "—"}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.18em] text-muted-foreground">GPS</dt>
              <dd className="text-sm">
                {invite.report.gps_lat
                  ? `${invite.report.gps_lat.toFixed(5)}, ${invite.report.gps_lng?.toFixed(5)}`
                  : "—"}
              </dd>
            </div>
          </dl>
        </header>

        {invite.custom_message ? (
          <p className="mt-8 rounded-2xl border border-border bg-muted/50 p-5 text-sm leading-relaxed">
            {invite.custom_message}
          </p>
        ) : null}

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {invite.media.map((m) => (
            <figure key={m.id} className="rounded-2xl border border-border bg-card p-3 shadow-soft">
              {m.url ? (
                m.is_video ? (
                  <video src={m.url} controls className="h-48 w-full rounded-xl bg-black object-cover" />
                ) : (
                  <img
                    src={m.url}
                    alt={`${m.room_label} — ${m.condition}`}
                    loading="lazy"
                    className="h-48 w-full rounded-xl object-cover"
                  />
                )
              ) : (
                <div className="h-48 w-full rounded-xl bg-muted" aria-hidden />
              )}
              <figcaption className="mt-3 space-y-1 px-1 pb-1 text-xs">
                <p className="text-sm font-medium">{m.room_label}</p>
                <p className="text-muted-foreground">Condition: {m.condition}</p>
                {m.note ? <p className="text-muted-foreground">{m.note}</p> : null}
                <p className="text-muted-foreground">
                  {m.gps_lat ? `${m.gps_lat.toFixed(5)}, ${m.gps_lng?.toFixed(5)}` : "GPS —"}
                </p>
                <p className="text-muted-foreground">{formatDate(m.exif_timestamp ?? m.created_at)}</p>
                <p className="break-all font-mono text-[0.65rem] text-muted-foreground">
                  {shortHash(m.file_hash_sha256)}
                </p>
              </figcaption>
            </figure>
          ))}
          {invite.media.length === 0 ? (
            <p className="text-sm text-muted-foreground">No media attached to this report.</p>
          ) : null}
        </div>

        <footer className="mt-10 border-t border-border pt-8">
          <p className="text-sm leading-relaxed">
            This report was created per A.R.S. § 33-1321(C). Media is cryptographically hashed and
            stored immutably.
          </p>
          <p className="mt-3 break-all font-mono text-[0.7rem] text-muted-foreground">
            Overall SHA-256: {invite.report.overall_hash ?? "pending"}
          </p>
        </footer>
      </article>

      {responded ? (
        <section className="glass-panel mt-6 p-8 text-center">
          {invite.status === "accepted" ? (
            <>
              <CheckCircle2 className="mx-auto h-7 w-7 text-lavender-deep" strokeWidth={1.5} />
              <h2 className="mt-4 text-xl font-semibold">Accepted and e-signed</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Signed by {invite.response_signature_name} on {formatDate(invite.responded_at)}.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="mx-auto h-7 w-7 text-lavender-deep" strokeWidth={1.5} />
              <h2 className="mt-4 text-xl font-semibold">Disputed</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Submitted {formatDate(invite.responded_at)}.
              </p>
              {invite.response_note ? (
                <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-border bg-muted/50 p-4 text-left text-sm">
                  {invite.response_note}
                </p>
              ) : null}
            </>
          )}
        </section>
      ) : (
        <section className="glass-panel mt-6 p-8">
          <h2 className="text-xl font-semibold">Your response</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No account needed. Link expires {formatDate(invite.expires_at)}.
          </p>

          {mode === null ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setMode("accept")}
                className="rounded-2xl bg-primary px-6 py-5 text-sm font-medium text-primary-foreground"
              >
                Accept &amp; E-Sign — I agree this is accurate
              </button>
              <button
                onClick={() => setMode("dispute")}
                className="rounded-2xl border border-border bg-card px-6 py-5 text-sm font-medium hover:bg-accent"
              >
                Dispute — Add Notes
              </button>
            </div>
          ) : null}

          {mode === "accept" ? (
            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Type full legal name as electronic signature
                </span>
                <input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Jane A. Landlord"
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 font-script text-2xl outline-none focus:ring-2 focus:ring-lavender/40"
                />
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border"
                />
                <span className="text-muted-foreground">
                  I agree this electronic signature is legally binding under the Arizona Electronic
                  Transactions Act and the federal ESIGN Act.
                </span>
              </label>
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Optional note
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
                />
              </label>
              <div className="flex gap-2">
                <button
                  disabled={!agreed || signature.trim().length < 2 || respond.isPending}
                  onClick={() => respond.mutate({ action: "accepted" })}
                  className="rounded-full bg-primary px-6 py-3 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  {respond.isPending ? "Signing…" : "Sign & accept"}
                </button>
                <button
                  onClick={() => setMode(null)}
                  className="rounded-full border border-border bg-card px-6 py-3 text-xs font-medium hover:bg-accent"
                >
                  Back
                </button>
              </div>
            </div>
          ) : null}

          {mode === "dispute" ? (
            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  What is inaccurate?
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={5}
                  placeholder="Describe the items you disagree with, room by room."
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
                />
              </label>
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Your name
                </span>
                <input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
                />
              </label>
              <div className="flex gap-2">
                <button
                  disabled={note.trim().length < 5 || respond.isPending}
                  onClick={() => respond.mutate({ action: "disputed" })}
                  className="rounded-full bg-primary px-6 py-3 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  {respond.isPending ? "Submitting…" : "Submit dispute"}
                </button>
                <button
                  onClick={() => setMode(null)}
                  className="rounded-full border border-border bg-card px-6 py-3 text-xs font-medium hover:bg-accent"
                >
                  Back
                </button>
              </div>
            </div>
          ) : null}
        </section>
      )}
    </Page>
  );
}

/* ---------------- Fallback: integrity-seal lookup by report id ---------------- */

function SealLookup({ id }: { id: string }) {
  const [report, setReport] = useState<{
    report_number: string;
    overall_hash: string | null;
    created_at: string;
    weather_snapshot: string | null;
  } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase
      .from("reports")
      .select("report_number, overall_hash, created_at, weather_snapshot")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setReport(data);
        setChecked(true);
      });
  }, [id]);

  return (
    <Page>
      <div className="glass-panel mx-auto max-w-xl p-10 text-center">
        <ShieldCheck className="mx-auto h-7 w-7 text-lavender" strokeWidth={1.5} />
        <h1 className="mt-5 text-3xl font-semibold">Report verification</h1>
        {!checked ? (
          <p className="mt-4 text-sm text-muted-foreground">Checking the seal…</p>
        ) : report ? (
          <div className="mt-6 space-y-3 text-sm">
            <p className="font-mono text-base">{report.report_number}</p>
            <p className="text-muted-foreground">Sealed {formatDate(report.created_at)}</p>
            <p className="text-muted-foreground">{report.weather_snapshot ?? ""}</p>
            <p className="break-all rounded-xl bg-muted p-4 font-mono text-[0.7rem]">
              {report.overall_hash ?? "Not yet sealed"}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            This link is not valid, or the report is private. Ask the tenant to send a fresh review
            request.
          </p>
        )}
        <p className="mt-8 text-xs text-muted-foreground">
          Reference <span className="font-mono">{id}</span>
        </p>
      </div>
    </Page>
  );
}

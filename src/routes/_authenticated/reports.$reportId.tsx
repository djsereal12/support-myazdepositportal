import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Page } from "@/components/site-shell";
import { MediaThumb } from "@/components/media-image";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, shortHash, REPORT_TYPE_LABEL } from "@/lib/deposit";
import { fetchPurchases, reportUnlocked, certifiedPdfUnlocked } from "@/lib/entitlements";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PRICES } from "@/lib/stripe";
import { Printer, Mail, Lock, Share2, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { createLandlordInvite } from "@/utils/invites.functions";
import { useServerFn } from "@tanstack/react-start";

const DEFAULT_INVITE_MESSAGE =
  "Per A.R.S. §33-1321, please review and accept the attached move-in inspection report within 5 days. This creates a joint record of pre-existing conditions.";

export const Route = createFileRoute("/_authenticated/reports/$reportId")({
  head: () => ({
    meta: [
      { title: "Report — deposit" },
      {
        name: "description",
        content: "A numbered, hashed condition report ready to print or share.",
      },
      { property: "og:title", content: "Report — deposit" },
      { property: "og:description", content: "Court-ready Arizona condition report." },
    ],
  }),
  component: ReportView,
});

function ReportView() {
  const { reportId } = Route.useParams();

  const { data: report } = useQuery({
    queryKey: ["report", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, properties(*)")
        .eq("id", reportId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: media } = useQuery({
    queryKey: ["media", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const queryClient = useQueryClient();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteMessage, setInviteMessage] = useState(DEFAULT_INVITE_MESSAGE);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const sendInvite = useServerFn(createLandlordInvite);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) =>
        setUser(
          data.user
            ? { id: data.user.id, ...(data.user.email ? { email: data.user.email } : {}) }
            : null,
        ),
      );
  }, []);

  const { data: purchases } = useQuery({ queryKey: ["purchases"], queryFn: fetchPurchases });
  const { data: shares } = useQuery({
    queryKey: ["shares", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_shares")
        .select("*")
        .eq("report_id", reportId);
      if (error) throw error;
      return data;
    },
  });

  const { data: invites } = useQuery({
    queryKey: ["invites", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landlord_invites")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: inviteMessages } = useQuery({
    queryKey: ["invite-messages", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invite_messages")
        .select("id, invite_id, author_role, author_name, body, created_at")
        .eq("report_id", reportId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const unlocked = reportUnlocked(purchases ?? [], reportId, report?.property_id ?? null);
  const certified = certifiedPdfUnlocked(purchases ?? [], reportId);

  function unlock(priceId: string) {
    openCheckout({
      priceId,
      reportId,
      ...(report?.property_id ? { propertyId: report.property_id } : {}),
      ...(user?.id ? { userId: user.id } : {}),
      ...(user?.email ? { customerEmail: user.email } : {}),
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  }

  async function share() {
    const email = shareEmail.trim().toLowerCase();
    if (!email) return;
    const { error } = await supabase
      .from("report_shares")
      .insert({ report_id: reportId, landlord_email: email });
    if (error) toast.error(error.message);
    else {
      toast.success(`Shared with ${email}`);
      setShareEmail("");
      queryClient.invalidateQueries({ queryKey: ["shares", reportId] });
    }
  }

  async function sendLandlordRequest() {
    setSending(true);
    try {
      const res = await sendInvite({
        data: {
          reportId,
          landlordEmail: inviteEmail,
          landlordName: inviteName,
          customMessage: inviteMessage,
          origin: window.location.origin,
        },
      });
      setInviteLink(res.link);
      if (res.emailSent) toast.success(`Request emailed to ${inviteEmail}`);
      else
        toast.info(
          "Request created. Email sending isn't configured yet — copy the link or send it yourself.",
        );
      queryClient.invalidateQueries({ queryKey: ["invites", reportId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the request.");
    } finally {
      setSending(false);
    }
  }

  const property = report?.properties as {
    address: string;
    unit: string | null;
    landlord_email: string | null;
    landlord_name: string | null;
  } | null;
  useEffect(() => {
    if (property?.landlord_email && !inviteEmail) setInviteEmail(property.landlord_email);
    if (property?.landlord_name && !inviteName) setInviteName(property.landlord_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.landlord_email]);

  const verifyUrl = report?.qr_verification_url ?? "";
  const qrSrc = verifyUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verifyUrl)}`
    : "";

  function email() {
    const subject = `Condition report ${report?.report_number} — ${property?.address ?? ""}`;
    const body = [
      `Attached is the ${REPORT_TYPE_LABEL[report?.type ?? "move_in"]} condition report for ${property?.address ?? ""}${property?.unit ? ` ${property.unit}` : ""}.`,
      "",
      `Report number: ${report?.report_number}`,
      `Created: ${formatDate(report?.created_at)}`,
      `Integrity hash: ${report?.overall_hash}`,
      `Verify: ${verifyUrl}`,
      "",
      "Created per A.R.S. § 33-1321(C). Media is cryptographically hashed and stored immutably.",
    ].join("\n");
    window.location.href = `mailto:${property?.landlord_email ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/properties/$propertyId"
          params={{ propertyId: report?.property_id ?? "" }}
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          ← Property file
        </Link>
        {unlocked ? (
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
            >
              <Printer className="h-3.5 w-3.5" /> Save as PDF
            </button>
            <button
              onClick={email}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium hover:bg-accent"
            >
              <Mail className="h-3.5 w-3.5" /> Email landlord
            </button>
            {certified ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-lavender/40 bg-lavender-soft px-5 py-2.5 text-xs font-medium">
                Certified export active
              </span>
            ) : (
              <button
                onClick={() => unlock(PRICES.certifiedPdf)}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium hover:bg-accent"
              >
                Certified court-ready PDF — $39
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium text-muted-foreground">
              <Lock className="h-3.5 w-3.5" /> Report locked
            </span>
          </div>
        )}
      </div>

      {isOpen ? (
        <section className="glass-panel mt-6 p-6 print:hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Complete your purchase</h2>
            <button
              onClick={closeCheckout}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
          {checkoutElement}
        </section>
      ) : null}

      {report?.type === "move_in" ? (
        <section className="glass-panel mt-6 p-6 print:hidden">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-lavender" strokeWidth={1.5} />
            <h2 className="text-sm font-semibold">Landlord acceptance</h2>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Send a secure review link. Your landlord can accept and e-sign or dispute with notes —
            no account required.
          </p>

          {!unlocked ? (
            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <button
                onClick={() => unlock(PRICES.singleReport)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
              >
                <Lock className="h-4 w-4" /> Unlock &amp; send — $14.99
              </button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Sends verified report to landlord, enables e-signature and dispute notes.
              </p>
              <button
                onClick={() => unlock(PRICES.bundle)}
                className="mt-4 w-full text-center text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Bundle for this property — $24.99 (includes move-out + demand letter, save $19)
              </button>
            </div>
          ) : !inviteOpen ? (
            <button
              onClick={() => setInviteOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
            >
              <Send className="h-3.5 w-3.5" /> Send to Landlord for Acceptance
            </button>
          ) : (
            <div className="mt-5 space-y-4 rounded-2xl border border-border bg-card p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Landlord email
                  </span>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="landlord@example.com"
                    className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Landlord name
                  </span>
                  <input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Landlord"
                    className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Message
                </span>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={sending || !inviteEmail.trim()}
                  onClick={sendLandlordRequest}
                  className="rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  {sending ? "Sending…" : "Send Request via Email"}
                </button>
                <button
                  onClick={() => setInviteOpen(false)}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-medium hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
              {inviteLink ? (
                <div className="rounded-xl border border-border bg-muted/50 p-4 text-xs">
                  <p className="text-muted-foreground">
                    Shareable review link (expires in 7 days):
                  </p>
                  <p className="mt-2 break-all font-mono">{inviteLink}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        toast.success("Link copied");
                      }}
                      className="rounded-full border border-border bg-card px-4 py-2 font-medium hover:bg-accent"
                    >
                      Copy link
                    </button>
                    <a
                      href={`mailto:${inviteEmail}?subject=${encodeURIComponent(`Action Required: Review Move-In Report for ${property?.address ?? ""}`)}&body=${encodeURIComponent(`${inviteMessage}\n\nView report: ${inviteLink}\n\nThis link expires in 7 days.`)}`}
                      className="rounded-full border border-border bg-card px-4 py-2 font-medium hover:bg-accent"
                    >
                      Open in email app
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {invites?.length ? (
            <ul className="mt-5 space-y-2">
              {invites.map((i) => (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-xs"
                >
                  <span className="font-medium">{i.landlord_email}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {i.status === "accepted" ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-lavender-deep" /> Accepted &amp;
                        e-signed by {i.response_signature_name} · {formatDate(i.responded_at)}
                      </>
                    ) : i.status === "disputed" ? (
                      <>
                        <AlertTriangle className="h-3.5 w-3.5 text-lavender-deep" /> Disputed ·{" "}
                        {formatDate(i.responded_at)}
                      </>
                    ) : (
                      <>Pending · sent {formatDate(i.sent_at)}</>
                    )}
                  </span>
                  {i.response_note ? (
                    <p className="w-full text-muted-foreground">Note: {i.response_note}</p>
                  ) : null}
                  {(inviteMessages ?? [])
                    .filter((m) => m.invite_id === i.id)
                    .map((m) => (
                      <p key={m.id} className="w-full text-muted-foreground">
                        {m.author_role === "landlord" ? "Landlord reply" : "Your reply"}
                        {m.author_name ? ` (${m.author_name})` : ""} · {formatDate(m.created_at)}:{" "}
                        {m.body}
                      </p>
                    ))}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="glass-panel mt-6 p-6 print:hidden">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-lavender" strokeWidth={1.5} />
          <h2 className="text-sm font-semibold">Share with your landlord</h2>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          They sign in with this email address and see the report read-only in the landlord portal.
        </p>
        {unlocked ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              type="email"
              placeholder="landlord@example.com"
              className="min-w-[16rem] flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
            />
            <button
              onClick={share}
              className="rounded-full bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground"
            >
              Share
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5 opacity-70">
            <p className="text-xs text-muted-foreground">
              <Lock className="inline h-3.5 w-3.5 align-text-bottom" /> Unlock report to share
            </p>
          </div>
        )}
        {shares?.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {shares.map((s) => (
              <li
                key={s.id}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
              >
                {s.landlord_email}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <article className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-soft sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="font-script text-3xl holo-text">deposit</p>
            <h1 className="mt-4 text-3xl font-semibold">
              {REPORT_TYPE_LABEL[report?.type ?? "move_in"]} Condition Report
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {property?.address}
              {property?.unit ? ` · ${property.unit}` : ""}
            </p>
          </div>
          <dl className="grid gap-2 text-right text-xs">
            <div>
              <dt className="uppercase tracking-[0.18em] text-muted-foreground">Report no.</dt>
              <dd className="font-mono text-sm">{report?.report_number}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.18em] text-muted-foreground">Created</dt>
              <dd className="text-sm">{formatDate(report?.created_at)}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.18em] text-muted-foreground">Conditions</dt>
              <dd className="text-sm">{report?.weather_snapshot ?? "—"}</dd>
            </div>
            <div>
              <dt className="uppercase tracking-[0.18em] text-muted-foreground">GPS</dt>
              <dd className="text-sm">
                {report?.gps_lat
                  ? `${report.gps_lat.toFixed(5)}, ${report.gps_lng?.toFixed(5)}`
                  : "—"}
              </dd>
            </div>
          </dl>
        </header>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="py-3 pr-4 font-medium">Room</th>
                <th className="py-3 pr-4 font-medium">Condition</th>
                <th className="py-3 pr-4 font-medium">Note</th>
                <th className="py-3 pr-4 font-medium">Media</th>
                <th className="py-3 pr-4 font-medium">Hash</th>
                <th className="py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {(media ?? []).map((m) => (
                <tr key={m.id} className="border-b border-border/70 align-top">
                  <td className="py-4 pr-4 font-medium">{m.room_label}</td>
                  <td className="py-4 pr-4">{m.condition}</td>
                  <td className="max-w-[16rem] py-4 pr-4 text-muted-foreground">{m.note || "—"}</td>
                  <td className="py-4 pr-4">
                    <MediaThumb path={m.file_url} alt={m.room_label} className="h-16 w-24" />
                  </td>
                  <td className="py-4 pr-4 font-mono text-xs">{shortHash(m.file_hash_sha256)}</td>
                  <td className="py-4 text-xs text-muted-foreground">
                    {formatDate(m.exif_timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-10 border-t border-border pt-8">
          <div className="flex flex-wrap gap-8">
            <div className="max-w-md flex-1">
              <p className="text-sm leading-relaxed">
                This report created per A.R.S. § 33-1321(C). Media cryptographically hashed and
                stored immutably.
              </p>
              <p className="mt-4 break-all font-mono text-[0.7rem] text-muted-foreground">
                Overall SHA-256: {report?.overall_hash ?? "pending"}
              </p>
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                <div>
                  <div className="h-10 border-b border-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">Tenant signature / date</p>
                </div>
                <div>
                  <div className="h-10 border-b border-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">Landlord signature / date</p>
                </div>
              </div>
            </div>
            {qrSrc ? (
              <div className="text-center">
                <img src={qrSrc} alt="Verification QR code" width={140} height={140} />
                <p className="mt-2 max-w-[140px] break-all text-[0.6rem] text-muted-foreground">
                  {verifyUrl}
                </p>
              </div>
            ) : null}
          </div>
        </footer>
      </article>
    </Page>
  );
}

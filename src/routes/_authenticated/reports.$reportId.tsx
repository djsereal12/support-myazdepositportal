import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Page } from "@/components/site-shell";
import { MediaThumb } from "@/components/media-image";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, shortHash, REPORT_TYPE_LABEL } from "@/lib/deposit";
import { Printer, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports/$reportId")({
  head: () => ({
    meta: [
      { title: "Report — DEPOSIT" },
      { name: "description", content: "A numbered, hashed condition report ready to print or share." },
      { property: "og:title", content: "Report — DEPOSIT" },
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

  const property = report?.properties as { address: string; unit: string | null; landlord_email: string | null } | null;
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
        </div>
      </div>

      <article className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-soft sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="font-script text-3xl text-lavender-deep">Deposit</p>
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
                {report?.gps_lat ? `${report.gps_lat.toFixed(5)}, ${report.gps_lng?.toFixed(5)}` : "—"}
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
                  <td className="py-4 text-xs text-muted-foreground">{formatDate(m.exif_timestamp)}</td>
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

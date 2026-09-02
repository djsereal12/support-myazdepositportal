import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/deposit";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/verify/$reportId")({
  head: () => ({
    meta: [
      { title: "Verify a DEPOSIT report" },
      { name: "description", content: "Check the integrity seal of a DEPOSIT condition report." },
      { property: "og:title", content: "Verify a DEPOSIT report" },
      { property: "og:description", content: "Confirm a report's SHA-256 integrity seal." },
    ],
  }),
  component: Verify,
});

function Verify() {
  const { reportId } = Route.useParams();
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
      .eq("id", reportId)
      .maybeSingle()
      .then(({ data }) => {
        setReport(data);
        setChecked(true);
      });
  }, [reportId]);

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
            This report is private. Sign in as its owner to view the integrity seal, or ask the
            tenant to share the signed PDF.
          </p>
        )}
        <p className="mt-8 text-xs text-muted-foreground">
          Report ID <span className="font-mono">{reportId}</span>
        </p>
      </div>
    </Page>
  );
}

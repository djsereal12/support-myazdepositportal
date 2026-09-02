import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Page, StatusChip } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { money, formatDate, REPORT_TYPE_LABEL } from "@/lib/deposit";
import { ScanLine, GitCompareArrows, Gavel, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/properties/$propertyId")({
  head: () => ({
    meta: [
      { title: "Property file — DEPOSIT" },
      { name: "description", content: "Reports, scans and dispute tools for this rental unit." },
      { property: "og:title", content: "Property file — DEPOSIT" },
      { property: "og:description", content: "Everything documented for this unit." },
    ],
  }),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { propertyId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: property } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("*").eq("id", propertyId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: reports } = useQuery({
    queryKey: ["reports", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function startScan(type: "move_in" | "move_out") {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("reports")
      .insert({ property_id: propertyId, user_id: userData.user!.id, type })
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Could not start scan");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["reports", propertyId] });
    navigate({ to: "/scan/$reportId", params: { reportId: data.id } });
  }

  const hasMoveIn = reports?.some((r) => r.type === "move_in" && r.overall_hash);
  const hasMoveOut = reports?.some((r) => r.type === "move_out" && r.overall_hash);

  return (
    <Page>
      <Link to="/dashboard" className="text-xs text-muted-foreground underline underline-offset-4">
        ← All properties
      </Link>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold leading-tight">
            {property?.address ?? "Loading…"}
            {property?.unit ? <span className="text-muted-foreground"> · {property.unit}</span> : null}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {property?.landlord_name ?? "Landlord not set"} · Deposit {money(property?.deposit_amount)}
          </p>
        </div>
        {property ? <StatusChip status={property.status} /> : null}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <button
          onClick={() => startScan("move_in")}
          className="glass-panel group flex items-start gap-4 p-7 text-left transition-shadow hover:shadow-lift"
        >
          <ScanLine className="mt-1 h-5 w-5 text-lavender" strokeWidth={1.6} />
          <span>
            <span className="block text-xl font-semibold">Start New Move-In Scan</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Eight guided captures, hashed and stamped on upload.
            </span>
          </span>
        </button>
        <button
          onClick={() => startScan("move_out")}
          className="glass-panel group flex items-start gap-4 p-7 text-left transition-shadow hover:shadow-lift"
        >
          <ScanLine className="mt-1 h-5 w-5 text-clay" strokeWidth={1.6} />
          <span>
            <span className="block text-xl font-semibold">Start Move-Out Scan</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Same checklist, compared automatically against move-in.
            </span>
          </span>
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Link
          to="/compare/$propertyId"
          params={{ propertyId }}
          className={`glass-panel flex items-center gap-4 p-6 transition-shadow hover:shadow-lift ${
            hasMoveIn && hasMoveOut ? "" : "opacity-60"
          }`}
        >
          <GitCompareArrows className="h-5 w-5 text-lavender" strokeWidth={1.6} />
          <span>
            <span className="block font-semibold">Side-by-side comparison</span>
            <span className="text-xs text-muted-foreground">
              {hasMoveIn && hasMoveOut ? "Ready to review" : "Needs a completed move-in and move-out"}
            </span>
          </span>
        </Link>
        <Link
          to="/demand/$propertyId"
          params={{ propertyId }}
          className="glass-panel flex items-center gap-4 p-6 transition-shadow hover:shadow-lift"
        >
          <Gavel className="h-5 w-5 text-lavender" strokeWidth={1.6} />
          <span>
            <span className="block font-semibold">Demand letter — $29</span>
            <span className="text-xs text-muted-foreground">Cites § 33-1321(D) and (E)</span>
          </span>
        </Link>
      </div>

      <h2 className="mt-14 text-2xl font-semibold">Reports</h2>
      <div className="mt-5 space-y-3">
        {!reports?.length ? (
          <p className="text-sm text-muted-foreground">No reports yet. Start a scan above.</p>
        ) : (
          reports.map((r) => (
            <Link
              key={r.id}
              to={r.overall_hash ? "/reports/$reportId" : "/scan/$reportId"}
              params={{ reportId: r.id }}
              className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5 transition-shadow hover:shadow-lift"
            >
              <div className="flex items-center gap-4">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {r.report_number} · {REPORT_TYPE_LABEL[r.type] ?? r.type}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                </div>
              </div>
              <StatusChip status={r.overall_hash ? "complete" : "in_progress"} />
            </Link>
          ))
        )}
      </div>
    </Page>
  );
}

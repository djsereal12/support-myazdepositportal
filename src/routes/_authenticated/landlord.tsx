import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, FileText } from "lucide-react";
import { Page, StatusChip } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, REPORT_TYPE_LABEL } from "@/lib/deposit";

export const Route = createFileRoute("/_authenticated/landlord")({
  head: () => ({
    meta: [
      { title: "Landlord portal — deposit" },
      {
        name: "description",
        content: "Review tenant condition reports, file a deposit dispute, and send a response letter.",
      },
      { property: "og:title", content: "Landlord portal — deposit" },
      { property: "og:description", content: "Tenant reports shared with you, in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandlordPortal,
});

function LandlordPortal() {
  const queryClient = useQueryClient();

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ["landlord-role"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("role", "landlord")
        .maybeSingle();
      if (error) throw error;
      return { enabled: !!data, email: userData.user?.email ?? "" };
    },
  });

  const { data: reports, isLoading } = useQuery({
    enabled: !!role?.enabled,
    queryKey: ["landlord-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, properties(address, unit, deposit_amount, landlord_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function enableLandlord() {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userData.user!.id, role: "landlord" });
    if (error) toast.error(error.message);
    else {
      toast.success("Landlord access enabled");
      queryClient.invalidateQueries({ queryKey: ["landlord-role"] });
    }
  }

  if (roleLoading) {
    return (
      <Page>
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </Page>
    );
  }

  if (!role?.enabled) {
    return (
      <Page>
        <div className="glass-panel mx-auto max-w-xl p-10">
          <Building2 className="h-6 w-6 text-lavender" strokeWidth={1.5} />
          <h1 className="mt-5 text-3xl font-semibold">Landlord access</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Turn on landlord mode for <span className="font-medium">{role?.email}</span>. You'll see
            every report a tenant shared with this email address, plus any unit that lists it as the
            landlord contact — and you can dispute a deposit or send a response letter from there.
          </p>
          <button
            onClick={enableLandlord}
            className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Enable landlord access
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        Landlord portal
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Tenant reports</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Shared with {role.email}. Reports appear automatically when a tenant lists this email on a
        property or shares a report directly.
      </p>

      {isLoading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : !reports?.length ? (
        <div className="glass-panel mt-8 p-10">
          <FileText className="h-6 w-6 text-lavender" strokeWidth={1.5} />
          <h2 className="mt-5 text-2xl font-semibold">Nothing shared yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Ask your tenant to add {role.email} as the landlord contact on their property, or to
            share the report from their report page.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {reports.map((r) => {
            const p = r.properties as { address: string; unit: string | null } | null;
            return (
              <Link
                key={r.id}
                to="/landlord/$reportId"
                params={{ reportId: r.id }}
                className="glass-panel p-7 transition-shadow hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold leading-snug">
                    {p?.address}
                    {p?.unit ? <span className="text-muted-foreground"> · {p.unit}</span> : null}
                  </h2>
                  <StatusChip status={r.status} />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {REPORT_TYPE_LABEL[r.type] ?? r.type} · {r.report_number}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </Page>
  );
}

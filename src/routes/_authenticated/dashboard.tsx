import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Page, StatusChip } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/deposit";
import { Plus, Home } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your properties — DEPOSIT" },
      { name: "description", content: "Every unit you're documenting, with report status at a glance." },
      { property: "og:title", content: "Your properties — DEPOSIT" },
      { property: "og:description", content: "Manage your Arizona deposit documentation." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Your portfolio
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Properties</h1>
        </div>
        <Link
          to="/properties/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add property
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : !data?.length ? (
        <div className="glass-panel mt-8 flex flex-col items-start p-10">
          <Home className="h-6 w-6 text-lavender" strokeWidth={1.5} />
          <h2 className="mt-5 text-2xl font-semibold">No properties yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Add the unit you're moving into, then run the guided scan before you unpack a single
            box.
          </p>
          <Link
            to="/properties/new"
            className="mt-7 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            Add your first property
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {data.map((p) => (
            <Link
              key={p.id}
              to="/properties/$propertyId"
              params={{ propertyId: p.id }}
              className="glass-panel group p-7 transition-shadow hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold leading-snug">
                  {p.address}
                  {p.unit ? <span className="text-muted-foreground"> · {p.unit}</span> : null}
                </h2>
                <StatusChip status={p.status} />
              </div>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Deposit
                  </dt>
                  <dd className="mt-1 font-medium">{money(p.deposit_amount)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    Landlord
                  </dt>
                  <dd className="mt-1 truncate font-medium">{p.landlord_name ?? "—"}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}

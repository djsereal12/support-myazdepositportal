import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Home,
  Mail,
  Scale,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { Page, StatusChip } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, money, shortHash, REPORT_TYPE_LABEL } from "@/lib/deposit";

export const Route = createFileRoute("/_authenticated/landlord")({
  head: () => ({
    meta: [
      { title: "Landlord portal — deposit" },
      {
        name: "description",
        content:
          "Review tenant condition reports, track sealed scans, file a deposit dispute, and send a response letter.",
      },
      { property: "og:title", content: "Landlord portal — deposit" },
      { property: "og:description", content: "Tenant reports shared with you, in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandlordPortal,
});

type PropertyRef = {
  address: string;
  unit: string | null;
  deposit_amount: number | null;
  landlord_name: string | null;
} | null;

const SEALED = new Set(["complete", "move_in_complete", "move_out_complete", "sealed"]);

function LandlordPortal() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"dashboard" | "tenants" | "reports">("dashboard");
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");

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

  const { data: disputes } = useQuery({
    enabled: !!role?.enabled,
    queryKey: ["landlord-all-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("id, report_id, amount_claimed, created_at")
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

  const rows = reports ?? [];

  const properties = useMemo(() => {
    const set = new Map<string, string>();
    rows.forEach((r) => {
      const p = r.properties as PropertyRef;
      if (p?.address) set.set(p.address, p.address);
    });
    return [...set.keys()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const p = r.properties as PropertyRef;
      if (propertyFilter !== "all" && p?.address !== propertyFilter) return false;
      if (!q) return true;
      return [p?.address, p?.unit, r.report_number, r.status, r.overall_hash]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, propertyFilter]);

  const stats = useMemo(() => {
    const deposits = new Map<string, number>();
    rows.forEach((r) => {
      const p = r.properties as PropertyRef;
      if (p?.address) deposits.set(`${p.address}${p.unit ?? ""}`, p.deposit_amount ?? 0);
    });
    const protectedTotal = [...deposits.values()].reduce((a, b) => a + b, 0);
    const sealed = rows.filter((r) => SEALED.has(r.status)).length;
    return {
      protectedTotal,
      units: deposits.size,
      active: rows.length - sealed,
      sealed,
      disputes: disputes?.length ?? 0,
      claimed: (disputes ?? []).reduce((a, d) => a + Number(d.amount_claimed ?? 0), 0),
    };
  }, [rows, disputes]);

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
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="glass-panel sticky top-24 p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {role.email.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{role.email}</p>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Landlord
                </p>
              </div>
            </div>

            <nav className="mt-5 space-y-1 text-sm">
              <SideItem
                icon={Home}
                label="Dashboard"
                active={tab === "dashboard"}
                onClick={() => setTab("dashboard")}
              />
              <SideItem
                icon={Users}
                label="Tenants"
                badge={String(rows.length)}
                active={tab === "tenants"}
                onClick={() => setTab("tenants")}
              />
              <SideItem
                icon={FileText}
                label="Reports"
                active={tab === "reports"}
                onClick={() => setTab("reports")}
              />
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Mail className="h-4 w-4" strokeWidth={1.5} /> Contact details
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Settings className="h-4 w-4" strokeWidth={1.5} /> Settings
              </Link>
            </nav>

            <div className="mt-6 rounded-2xl bg-foreground p-4 text-background">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Shield className="h-4 w-4" strokeWidth={1.5} /> A.R.S. § 33-1321 compliant
              </div>
              <p className="mt-2 text-[0.72rem] leading-relaxed opacity-80">
                Every scan is SHA-256 hashed, timestamped and QR verifiable — court-ready evidence
                for Arizona deposit itemization.
              </p>
              <Link
                to="/law"
                className="mt-3 inline-flex rounded-full bg-background px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-foreground"
              >
                View protocol
              </Link>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div>
          <div className="glass-panel flex flex-wrap items-center gap-3 p-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-success" />
              Live · Arizona
            </span>
            <label className="relative flex min-w-[14rem] flex-1 items-center">
              <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenants, unit, report no…"
                className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
              />
            </label>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="h-10 rounded-full border border-border bg-card px-4 text-sm outline-none"
            >
              <option value="all">All properties</option>
              {properties.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Protect deposits. Prevent disputes.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Move-in scans sealed with SHA-256, GPS and weather. Shared with {role.email} · A.R.S.
              §33-1321(D)(E) compliant reporting.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Shield}
              label="Total protected deposits"
              value={money(stats.protectedTotal)}
              foot={`${stats.units} unit${stats.units === 1 ? "" : "s"} · AZ`}
            />
            <StatCard
              icon={Clock3}
              label="Active scans"
              value={String(stats.active)}
              foot="Invited + started"
            />
            <StatCard
              icon={FileText}
              label="Sealed reports"
              value={String(stats.sealed)}
              foot="SHA-256 + QR verified"
            />
            <StatCard
              icon={Scale}
              label="Disputes filed"
              value={String(stats.disputes)}
              foot={`${money(stats.claimed)} claimed`}
            />
          </div>

          {tab === "dashboard" ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <section className="glass-panel p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Recent activity</h2>
                  <button
                    onClick={() => setTab("reports")}
                    className="text-xs text-muted-foreground underline underline-offset-4"
                  >
                    View all →
                  </button>
                </div>
                <ul className="mt-5 space-y-4">
                  {filtered.slice(0, 5).map((r) => {
                    const p = r.properties as PropertyRef;
                    const sealed = SEALED.has(r.status);
                    return (
                      <li key={r.id} className="flex gap-3">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${sealed ? "bg-success" : "bg-lavender"}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm">
                            {p?.address}
                            {p?.unit ? ` · ${p.unit}` : ""} — {REPORT_TYPE_LABEL[r.type] ?? r.type}{" "}
                            {sealed ? "sealed" : "in progress"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(r.created_at)} ·{" "}
                            {shortHash(r.overall_hash) || "no seal yet"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                  {!filtered.length && !isLoading ? (
                    <li className="text-sm text-muted-foreground">No reports shared yet.</li>
                  ) : null}
                </ul>
                <p className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} />
                  Links are cryptographically tied — any edit to a photo breaks the fingerprint.
                </p>
              </section>

              <section className="glass-panel p-6">
                <h2 className="text-lg font-semibold">Needs attention</h2>
                <ul className="mt-5 space-y-3">
                  {filtered
                    .filter((r) => !(disputes ?? []).some((d) => d.report_id === r.id))
                    .slice(0, 4)
                    .map((r) => {
                      const p = r.properties as PropertyRef;
                      return (
                        <li
                          key={r.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {p?.address}
                              {p?.unit ? ` · ${p.unit}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.report_number} · not yet reviewed
                            </p>
                          </div>
                          <Link
                            to="/landlord/$reportId"
                            params={{ reportId: r.id }}
                            className="shrink-0 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                          >
                            Review
                          </Link>
                        </li>
                      );
                    })}
                  {!filtered.length ? (
                    <li className="text-sm text-muted-foreground">Nothing waiting on you.</li>
                  ) : null}
                </ul>
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={1.5} />
                  Reviewed reports move out of this list automatically.
                </div>
              </section>
            </div>
          ) : null}

          <section className="glass-panel mt-6 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {tab === "tenants"
                  ? "Tenants"
                  : tab === "reports"
                    ? "All reports"
                    : "Latest reports"}
              </h2>
              <span className="text-xs text-muted-foreground">{filtered.length} records</span>
            </div>

            {isLoading ? (
              <div className="mt-6 h-32 animate-pulse rounded-2xl bg-muted" />
            ) : !filtered.length ? (
              <div className="mt-6">
                <FileText className="h-6 w-6 text-lavender" strokeWidth={1.5} />
                <h3 className="mt-4 text-xl font-semibold">Nothing shared yet</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Ask your tenant to add {role.email} as the landlord contact on their property, or
                  to share the report from their report page.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Unit</th>
                      <th className="py-3 pr-4 font-medium">Report</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 pr-4 font-medium">Seal</th>
                      <th className="py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tab === "dashboard" ? filtered.slice(0, 5) : filtered).map((r) => {
                      const p = r.properties as PropertyRef;
                      return (
                        <tr key={r.id} className="border-b border-border/70">
                          <td className="py-4 pr-4">
                            <p className="font-medium">
                              {p?.address}
                              {p?.unit ? ` · ${p.unit}` : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Deposit {money(p?.deposit_amount)}
                            </p>
                          </td>
                          <td className="py-4 pr-4">
                            <p>{REPORT_TYPE_LABEL[r.type] ?? r.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.report_number} · {formatDate(r.created_at)}
                            </p>
                          </td>
                          <td className="py-4 pr-4">
                            <StatusChip status={r.status} />
                          </td>
                          <td className="py-4 pr-4 font-mono text-xs">
                            {shortHash(r.overall_hash) || "—"}
                          </td>
                          <td className="py-4">
                            <Link
                              to="/landlord/$reportId"
                              params={{ reportId: r.id }}
                              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-accent"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p className="mt-6 text-xs text-muted-foreground">
            A.R.S. §33-1321(D)(E) — security deposit itemization requires move-in condition
            documentation. deposit seals reports with SHA-256 and QR verification.
          </p>
        </div>
      </div>
    </Page>
  );
}

function SideItem({
  icon: Icon,
  label,
  badge,
  active,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  badge?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
      <span className="flex-1 text-left">{label}</span>
      {badge ? <span className="text-xs opacity-70">{badge}</span> : null}
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  foot,
}: {
  icon: typeof Home;
  label: string;
  value: string;
  foot: string;
}) {
  return (
    <div className="glass-panel p-5">
      <div className="flex items-start justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card">
          <Icon className="h-4 w-4 text-lavender" strokeWidth={1.5} />
        </span>
        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Live</span>
      </div>
      <p className="mt-4 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{foot}</p>
    </div>
  );
}

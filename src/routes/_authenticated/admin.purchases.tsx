import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Page } from "@/components/site-shell";
import { amIAdmin } from "@/utils/admin.functions";
import {
  searchPurchases,
  resyncPurchase,
  type AdminPurchaseRow,
} from "@/utils/admin-purchases.functions";
import { formatDate } from "@/lib/deposit";
import { toast } from "sonner";
import { ShieldCheck, Search, RefreshCw, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/purchases")({
  head: () => ({
    meta: [
      { title: "Purchase lookup — deposit admin" },
      {
        name: "description",
        content: "Search deposit purchases by email, phone or payment id and re-sync entitlements.",
      },
      { property: "og:title", content: "Purchase lookup — deposit admin" },
      { property: "og:description", content: "Admin purchase search and entitlement re-sync." },
    ],
  }),
  component: AdminPurchasesPage,
});

function money(amount: number | null, currency: string | null) {
  if (amount == null) return "—";
  return `${currency ? currency.toUpperCase() + " " : "$"}${amount.toFixed(2)}`;
}

function AdminPurchasesPage() {
  const checkAdmin = useServerFn(amIAdmin);
  const runSearch = useServerFn(searchPurchases);
  const runResync = useServerFn(resyncPurchase);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminPurchaseRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [manualEnv, setManualEnv] = useState<"sandbox" | "live">("live");

  const { data: gate, isLoading: gateLoading } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => checkAdmin(),
  });

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    try {
      const rows = await runSearch({ data: { query } });
      setResults(rows);
      if (!rows.length) toast.info("No purchases matched that search");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function refresh() {
    if (!query.trim()) return;
    try {
      setResults(await runSearch({ data: { query } }));
    } catch {
      /* keep previous results */
    }
  }

  async function onResync(sessionId: string, environment: "sandbox" | "live") {
    setBusy(sessionId);
    try {
      const res = await runResync({ data: { sessionId, environment } });
      toast.success(
        res.linked
          ? `Synced ${res.status} · linked to ${res.email ?? res.userId}`
          : `Synced ${res.status} · no matching account for ${res.email ?? "this buyer"}`,
      );
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Re-sync failed");
    } finally {
      setBusy(null);
    }
  }

  async function onManualResync(e: React.FormEvent) {
    e.preventDefault();
    if (!manualId.trim()) return;
    await onResync(manualId.trim(), manualEnv);
    setManualId("");
  }

  if (gateLoading) {
    return (
      <Page>
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </Page>
    );
  }

  if (!gate?.admin) {
    return (
      <Page>
        <div className="glass-panel p-10">
          <ShieldCheck className="h-6 w-6 text-lavender" strokeWidth={1.5} />
          <h1 className="mt-5 text-2xl font-semibold">Admin access required</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This console is limited to accounts listed as administrators.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        Administration
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Purchase lookup</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Find any payment by buyer email, account phone number, purchase id, Stripe checkout session
        or customer id — then re-sync it against Stripe to restore a missing entitlement.
      </p>
      <a
        href="/admin"
        className="glass-button mt-5 inline-flex rounded-xl px-4 py-2 text-sm font-medium"
      >
        Back to users
      </a>

      <form onSubmit={onSearch} className="glass-panel mt-8 flex flex-col gap-3 p-5 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="tenant@email.com · (602) 555-0134 · cs_live_… · cus_…"
          className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-lavender"
        />
        <button
          type="submit"
          disabled={searching}
          className="glass-button inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-60"
        >
          <Search className="h-4 w-4" /> {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {results && (
        <div className="glass-panel mt-6 overflow-x-auto p-2">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment id</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {results.map((p) => (
                <tr key={p.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.email ?? p.linked_email ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.user_id ? (
                        <>linked account{p.phone ? ` · ${p.phone}` : ""}</>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <AlertTriangle className="h-3.5 w-3.5" /> not linked to an account
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{p.price_id}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.report_id ? `report ${p.report_id.slice(0, 8)}` : ""}
                      {p.property_id ? ` · property ${p.property_id.slice(0, 8)}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">{money(p.amount_total, p.currency)}</td>
                  <td className="px-4 py-3">
                    <div>{p.status}</div>
                    <div className="text-xs text-muted-foreground">{p.environment}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div className="break-all">{p.stripe_session_id}</div>
                    {p.stripe_customer_id && (
                      <div className="break-all">{p.stripe_customer_id}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        onResync(p.stripe_session_id, p.environment === "live" ? "live" : "sandbox")
                      }
                      disabled={busy === p.stripe_session_id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:border-lavender disabled:opacity-60"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${busy === p.stripe_session_id ? "animate-spin" : ""}`}
                      />
                      Re-sync
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="glass-panel mt-8 p-6">
        <h2 className="text-lg font-semibold">Re-sync by checkout session</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          If a payment never reached the database at all, paste the Stripe checkout session id
          (starts with <code>cs_</code>). We pull it from Stripe, record it, and link it to the
          buyer's account by verified email.
        </p>
        <form onSubmit={onManualResync} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="cs_live_…"
            className="w-full rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-lavender"
          />
          <select
            value={manualEnv}
            onChange={(e) => setManualEnv(e.target.value as "sandbox" | "live")}
            className="rounded-xl border border-border bg-background/60 px-4 py-2.5 text-sm outline-none focus:border-lavender"
          >
            <option value="live">live</option>
            <option value="sandbox">sandbox</option>
          </select>
          <button
            type="submit"
            disabled={busy === manualId.trim()}
            className="glass-button inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" /> Re-sync
          </button>
        </form>
      </div>
    </Page>
  );
}

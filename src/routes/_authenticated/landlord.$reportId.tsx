import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Printer, Save, Scale } from "lucide-react";
import { Page } from "@/components/site-shell";
import { MediaThumb } from "@/components/media-image";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, money, shortHash, REPORT_TYPE_LABEL } from "@/lib/deposit";

export const Route = createFileRoute("/_authenticated/landlord/$reportId")({
  head: () => ({
    meta: [
      { title: "Review tenant report — deposit" },
      {
        name: "description",
        content: "Review a tenant's condition report, dispute the deposit, or send a response letter.",
      },
      { property: "og:title", content: "Review tenant report — deposit" },
      { property: "og:description", content: "Landlord review, dispute, and response letter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LandlordReport,
});

function LandlordReport() {
  const { reportId } = Route.useParams();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState("");
  const [letterBody, setLetterBody] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: report } = useQuery({
    queryKey: ["landlord-report", reportId],
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
    queryKey: ["landlord-media", reportId],
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

  const { data: disputes } = useQuery({
    queryKey: ["landlord-disputes", reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const property = report?.properties as
    | { address: string; unit: string | null; deposit_amount: number | null; landlord_name: string | null }
    | null;

  async function fileDispute() {
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("disputes").insert({
      report_id: reportId,
      property_id: report?.property_id ?? null,
      landlord_id: userData.user!.id,
      tenant_id: report?.user_id ?? null,
      amount_claimed: Number(amount || 0),
      reason,
      items,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Dispute filed — the tenant can see it on their report");
      setAmount("");
      setReason("");
      setItems("");
      queryClient.invalidateQueries({ queryKey: ["landlord-disputes", reportId] });
    }
  }

  function defaultLetter() {
    return [
      `RE: Response regarding security deposit — ${property?.address ?? ""}${property?.unit ? ` ${property.unit}` : ""}`,
      "",
      "Dear Tenant,",
      "",
      `I have reviewed condition report ${report?.report_number ?? ""} dated ${formatDate(report?.created_at)}.`,
      "",
      `Of the ${money(property?.deposit_amount)} security deposit, ${money(Number(amount || 0))} is being withheld for the following itemized reasons:`,
      "",
      items || "(itemize deductions here)",
      "",
      reason ? `Additional notes: ${reason}` : "",
      "",
      "This itemized statement is provided pursuant to A.R.S. § 33-1321(D). The remaining balance is being returned to your forwarding address.",
      "",
      "Sincerely,",
      property?.landlord_name ?? "Landlord",
    ]
      .filter((l) => l !== null)
      .join("\n");
  }

  async function saveLetter() {
    const body = letterBody || defaultLetter();
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("landlord_letters").insert({
      report_id: reportId,
      property_id: report?.property_id ?? null,
      landlord_id: userData.user!.id,
      amount_withheld: Number(amount || 0),
      body,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Response letter sent to the tenant's file");
  }

  return (
    <Page>
      <div className="print:hidden">
        <Link to="/landlord" className="text-xs text-muted-foreground underline underline-offset-4">
          ← Landlord portal
        </Link>
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
              <dt className="uppercase tracking-[0.18em] text-muted-foreground">Deposit</dt>
              <dd className="text-sm">{money(property?.deposit_amount)}</dd>
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
      </article>

      <section className="mt-6 grid gap-4 lg:grid-cols-2 print:hidden">
        <div className="glass-panel p-8">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-lavender" strokeWidth={1.5} />
            <h2 className="text-xl font-semibold">Dispute the deposit</h2>
          </div>
          <label className="mt-6 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Amount claimed
          </label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="450"
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
          />
          <label className="mt-5 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Itemized deductions
          </label>
          <textarea
            value={items}
            onChange={(e) => setItems(e.target.value)}
            rows={4}
            placeholder={"Carpet cleaning — $180\nWall repair, bedroom — $270"}
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
          />
          <label className="mt-5 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-lavender/40"
          />
          <button
            disabled={busy}
            onClick={fileDispute}
            className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            File dispute
          </button>

          {disputes?.length ? (
            <ul className="mt-8 space-y-3 text-sm">
              {disputes.map((d) => (
                <li key={d.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex justify-between">
                    <span className="font-medium">{money(d.amount_claimed)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(d.created_at)}</span>
                  </div>
                  {d.reason ? <p className="mt-2 text-muted-foreground">{d.reason}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="glass-panel p-8">
          <h2 className="text-xl font-semibold">Response letter</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Auto-filled from this report and your dispute amounts. Edit freely, then save it to the
            tenant's file or print it.
          </p>
          <textarea
            value={letterBody || defaultLetter()}
            onChange={(e) => setLetterBody(e.target.value)}
            rows={16}
            className="mt-5 w-full rounded-xl border border-border bg-card px-4 py-3 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-lavender/40"
          />
          <div className="mt-6 flex gap-2">
            <button
              disabled={busy}
              onClick={saveLetter}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> Send to tenant
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>
      </section>
    </Page>
  );
}

import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Megaphone, Send, ShieldCheck, Trash2, Users, Download } from "lucide-react";
import { Page } from "@/components/site-shell";
import { amIAdmin } from "@/utils/admin.functions";
import {
  listCampaigns,
  listSubscribers,
  saveCampaign,
  deleteCampaign,
  sendCampaign,
  sendCampaignTest,
  importAppUsers,
  setSubscriberStatus,
  type Campaign,
} from "@/utils/marketing.functions";
import { renderCampaignHtml } from "@/lib/marketing-template";

export const Route = createFileRoute("/_authenticated/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing emails — deposit" },
      {
        name: "description",
        content:
          "Send Arizona security deposit campaigns to opted-in tenants from a dedicated marketing sender.",
      },
      { property: "og:title", content: "Marketing emails — deposit" },
      {
        property: "og:description",
        content: "Campaign composer and subscriber list for deposit marketing email.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketingPage,
});

const emptyDraft = {
  id: undefined as string | undefined,
  name: "",
  subject: "",
  previewText: "",
  headline: "",
  body: "",
  ctaLabel: "",
  ctaUrl: "",
};

function MarketingPage() {
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(amIAdmin);
  const fetchCampaigns = useServerFn(listCampaigns);
  const fetchSubscribers = useServerFn(listSubscribers);
  const save = useServerFn(saveCampaign);
  const remove = useServerFn(deleteCampaign);
  const send = useServerFn(sendCampaign);
  const sendTest = useServerFn(sendCampaignTest);
  const importUsers = useServerFn(importAppUsers);
  const setStatus = useServerFn(setSubscriberStatus);

  const [draft, setDraft] = useState(emptyDraft);
  const [testEmail, setTestEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: gate, isLoading: gateLoading } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => checkAdmin(),
  });

  const enabled = Boolean(gate?.admin);
  const { data: campaigns } = useQuery({
    queryKey: ["marketing-campaigns"],
    enabled,
    queryFn: () => fetchCampaigns(),
  });
  const { data: subscribers } = useQuery({
    queryKey: ["marketing-subscribers"],
    enabled,
    queryFn: () => fetchSubscribers(),
  });

  const active = (subscribers ?? []).filter((s) => s.status === "subscribed").length;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["marketing-campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["marketing-subscribers"] });
  }

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      toast.success(label);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function loadCampaign(c: Campaign) {
    setDraft({
      id: c.id,
      name: c.name,
      subject: c.subject,
      previewText: c.preview_text ?? "",
      headline: c.headline ?? "",
      body: c.body,
      ctaLabel: c.cta_label ?? "",
      ctaUrl: c.cta_url ?? "",
    });
  }

  async function onSave() {
    await run("Draft saved", async () => {
      const res = await save({ data: draft });
      setDraft((d) => ({ ...d, id: (res as { id: string }).id }));
    });
  }

  async function onSend() {
    if (!draft.id) {
      toast.error("Save the draft first");
      return;
    }
    if (!confirm(`Send "${draft.subject}" to ${active} subscribers? This cannot be undone.`))
      return;
    await run("Campaign sent", () => send({ data: { id: draft.id! } }));
    setDraft(emptyDraft);
  }

  if (gateLoading) {
    return (
      <Page>
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </Page>
    );
  }

  if (!enabled) {
    return (
      <Page>
        <div className="glass-panel p-10">
          <ShieldCheck className="h-6 w-6 text-lavender" strokeWidth={1.5} />
          <h1 className="mt-5 text-2xl font-semibold">Admin access required</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Marketing campaigns are limited to administrator accounts.
          </p>
        </div>
      </Page>
    );
  }

  const previewHtml = renderCampaignHtml(
    {
      headline: draft.headline,
      body: draft.body || "Start typing your campaign to see the preview.",
      ctaLabel: draft.ctaLabel,
      ctaUrl: draft.ctaUrl,
      previewText: draft.previewText,
    },
    "#",
  );

  return (
    <Page>
      <header className="mb-8">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Megaphone className="h-4 w-4 text-lavender" strokeWidth={1.5} /> Marketing
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Campaigns</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Marketing goes out through a dedicated broadcast sender on its own subdomain, kept
          separate from sign-in, invite and report email so campaign complaints can never hurt the
          deliverability of the messages tenants must receive.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-panel p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Subscribed</p>
          <p className="mt-1 text-2xl font-semibold">{active}</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total contacts</p>
          <p className="mt-1 text-2xl font-semibold">{subscribers?.length ?? 0}</p>
        </div>
        <div className="glass-panel flex items-center p-5">
          <button
            disabled={busy}
            onClick={() =>
              run("App users imported", async () => {
                const res = (await importUsers({})) as { imported: number };
                if (!res.imported) toast.message("No new app users to add");
              })
            }
            className="glass-button flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
          >
            <Download className="h-4 w-4" strokeWidth={1.5} /> Import app users
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <section className="glass-panel p-6">
          <h2 className="text-lg font-semibold">Compose</h2>
          <div className="mt-5 space-y-4">
            {(
              [
                ["Campaign name", "name", "October Arizona deposit tips"],
                ["Subject line", "subject", "Get your Arizona deposit back in 14 days"],
                [
                  "Preview text",
                  "previewText",
                  "What landlords must return under A.R.S. § 33-1321",
                ],
                ["Headline", "headline", "Your deposit has a deadline"],
              ] as const
            ).map(([label, key, placeholder]) => (
              <label key={key} className="block">
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
                <input
                  value={(draft as Record<string, any>)[key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="mt-1 w-full rounded-xl border border-border/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-lavender"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Body</span>
              <textarea
                value={draft.body}
                onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                rows={10}
                placeholder={"Blank line separates paragraphs."}
                className="mt-1 w-full rounded-xl border border-border/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-lavender"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Button label</span>
                <input
                  value={draft.ctaLabel}
                  onChange={(e) => setDraft((d) => ({ ...d, ctaLabel: e.target.value }))}
                  placeholder="Start a move-out report"
                  className="mt-1 w-full rounded-xl border border-border/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-lavender"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Button link</span>
                <input
                  value={draft.ctaUrl}
                  onChange={(e) => setDraft((d) => ({ ...d, ctaUrl: e.target.value }))}
                  placeholder="https://myazdepositportal.live/pricing"
                  className="mt-1 w-full rounded-xl border border-border/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-lavender"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              disabled={busy}
              onClick={onSave}
              className="glass-button rounded-xl px-4 py-2 text-sm font-medium"
            >
              Save draft
            </button>
            <input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@email.com"
              className="w-48 rounded-xl border border-border/70 bg-white/70 px-3 py-2 text-sm outline-none focus:border-lavender"
            />
            <button
              disabled={busy || !draft.id}
              onClick={() =>
                run("Test sent", () => sendTest({ data: { id: draft.id!, to: testEmail } }))
              }
              className="rounded-xl border border-border/70 px-4 py-2 text-sm disabled:opacity-50"
            >
              Send test
            </button>
            <button
              disabled={busy || !draft.id}
              onClick={onSend}
              className="glass-button ml-auto flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              <Send className="h-4 w-4" strokeWidth={1.5} /> Send to {active}
            </button>
            {draft.id && (
              <button
                onClick={() => setDraft(emptyDraft)}
                className="text-xs text-muted-foreground underline"
              >
                New campaign
              </button>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="glass-panel overflow-hidden p-2">
            <p className="px-4 pt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Live preview
            </p>
            <iframe
              title="Campaign preview"
              srcDoc={previewHtml}
              className="mt-2 h-[420px] w-full rounded-2xl border border-border/60 bg-white"
            />
          </section>

          <section className="glass-panel p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-lavender" strokeWidth={1.5} /> Subscribers
            </h2>
            <ul className="mt-4 max-h-64 space-y-2 overflow-auto text-sm">
              {(subscribers ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    {s.email}
                    <span className="ml-2 text-[11px] text-muted-foreground">{s.source}</span>
                  </span>
                  <button
                    onClick={() =>
                      run("Updated", () =>
                        setStatus({
                          data: {
                            id: s.id,
                            status: s.status === "subscribed" ? "unsubscribed" : "subscribed",
                          },
                        }),
                      )
                    }
                    className="shrink-0 text-[11px] text-muted-foreground underline"
                  >
                    {s.status === "subscribed" ? "unsubscribe" : "resubscribe"}
                  </button>
                </li>
              ))}
              {!subscribers?.length && (
                <li className="text-xs text-muted-foreground">No subscribers yet.</li>
              )}
            </ul>
          </section>
        </aside>
      </div>

      <section className="glass-panel mt-8 p-6">
        <h2 className="text-lg font-semibold">History</h2>
        <div className="mt-4 space-y-3">
          {(campaigns ?? []).map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{c.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {c.name} · {c.status}
                  {c.sent_at ? ` · ${new Date(c.sent_at).toLocaleDateString()}` : ""}
                  {c.status === "sent" ? ` · ${c.recipient_count} recipients` : ""}
                  {c.error_message ? ` · ${c.error_message}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {c.status !== "sent" && (
                  <button onClick={() => loadCampaign(c)} className="text-xs underline">
                    Edit
                  </button>
                )}
                {c.status !== "sent" && (
                  <button
                    onClick={() => run("Deleted", () => remove({ data: { id: c.id } }))}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Delete campaign"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {!campaigns?.length && <p className="text-xs text-muted-foreground">No campaigns yet.</p>}
        </div>
      </section>
    </Page>
  );
}

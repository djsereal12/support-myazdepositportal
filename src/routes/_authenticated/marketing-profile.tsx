import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Page } from "@/components/site-shell";
import { amIAdmin } from "@/utils/admin.functions";
import {
  getMarketingProfile,
  saveMarketingProfile,
  resetMarketingProfile,
} from "@/utils/marketing-profile.functions";
import { DEFAULT_MARKETING_PROFILE, type MarketingProfile } from "@/lib/marketing-profile";

export const Route = createFileRoute("/_authenticated/marketing-profile")({
  head: () => ({
    meta: [
      { title: "Marketing profile — deposit" },
      {
        name: "description",
        content:
          "Brand positioning, audience, value props and approved ad copy for deposit's Arizona campaigns.",
      },
      { property: "og:title", content: "Marketing profile — deposit" },
      {
        property: "og:description",
        content: "The single source of truth for deposit's messaging, emails and ads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarketingProfilePage,
});

function Field({
  label,
  hint,
  value,
  rows = 3,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="glass mt-2 w-full rounded-2xl px-4 py-3 text-sm outline-none"
      />
    </label>
  );
}

function ListField({
  label,
  hint,
  items,
  limit,
  onChange,
}: {
  label: string;
  hint?: string;
  items: string[];
  limit?: number;
  onChange: (v: string[]) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <span className="mt-0.5 block text-xs text-muted-foreground">
        {hint ? `${hint} — ` : ""}one per line
        {limit ? ` · max ${limit} characters each` : ""}
      </span>
      <textarea
        value={items.join("\n")}
        rows={Math.min(Math.max(items.length + 1, 4), 16)}
        onChange={(e) => onChange(e.target.value.split("\n"))}
        className="glass mt-2 w-full rounded-2xl px-4 py-3 font-mono text-xs outline-none"
      />
      {limit && items.some((i) => i.trim().length > limit) && (
        <span className="mt-1 block text-xs text-destructive">
          Some lines are longer than {limit} characters and will be trimmed when saved.
        </span>
      )}
    </label>
  );
}

function MarketingProfilePage() {
  const { data: isAdmin, isLoading: checking } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => amIAdmin(),
  });
  const load = useServerFn(getMarketingProfile);
  const save = useServerFn(saveMarketingProfile);
  const reset = useServerFn(resetMarketingProfile);

  const { data } = useQuery({
    queryKey: ["marketing-profile"],
    queryFn: () => load(),
    enabled: isAdmin === true,
  });

  const [draft, setDraft] = useState<MarketingProfile>(DEFAULT_MARKETING_PROFILE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  function set<K extends keyof MarketingProfile>(key: K, value: MarketingProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function onSave() {
    setSaving(true);
    try {
      const saved = await save({ data: draft });
      setDraft(saved);
      toast.success("Marketing profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function onReset() {
    setSaving(true);
    try {
      const fresh = await reset();
      setDraft(fresh);
      toast.success("Restored the starting profile");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reset");
    } finally {
      setSaving(false);
    }
  }

  function copyBrief() {
    const brief = [
      `${draft.brand_name.toUpperCase()} — marketing profile`,
      "",
      `One-liner: ${draft.one_liner}`,
      "",
      `Positioning:\n${draft.positioning}`,
      "",
      `Audience:\n${draft.audience}`,
      "",
      `Tone:\n${draft.tone}`,
      "",
      `Value props:\n${draft.value_props.map((v) => `- ${v}`).join("\n")}`,
      "",
      `Objections:\n${draft.objections.map((v) => `- ${v}`).join("\n")}`,
      "",
      `Taglines:\n${draft.taglines.map((v) => `- ${v}`).join("\n")}`,
      "",
      `Ad headlines:\n${draft.ad_headlines.map((v) => `- ${v}`).join("\n")}`,
      "",
      `Ad descriptions:\n${draft.ad_descriptions.map((v) => `- ${v}`).join("\n")}`,
      "",
      `Keywords:\n${draft.keywords.map((v) => `- ${v}`).join("\n")}`,
    ].join("\n");
    void navigator.clipboard.writeText(brief);
    toast.success("Full brief copied");
  }

  if (checking) {
    return (
      <Page>
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </Page>
    );
  }

  if (!isAdmin) {
    return (
      <Page>
        <div className="glass mx-auto max-w-lg rounded-3xl p-8 text-center">
          <ShieldCheck className="mx-auto h-6 w-6 text-muted-foreground" />
          <h1 className="mt-3 text-xl font-semibold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page holds the brand and campaign messaging for deposit.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Marketing</p>
          <h1 className="mt-2 text-3xl font-semibold">Marketing profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            One source of truth for how deposit talks about itself. Campaign emails and ad copy are
            written from this. Also see{" "}
            <Link to="/marketing" className="underline underline-offset-4">
              marketing emails
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyBrief}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm"
          >
            <Copy className="h-4 w-4" /> Copy brief
          </button>
          <button
            onClick={onReset}
            disabled={saving}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm text-background disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="glass space-y-5 rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Positioning</h2>
          <Field
            label="One-liner"
            hint="The single sentence used in ads, the app store, and intros."
            rows={2}
            value={draft.one_liner}
            onChange={(v) => set("one_liner", v)}
          />
          <Field
            label="Positioning statement"
            rows={5}
            value={draft.positioning}
            onChange={(v) => set("positioning", v)}
          />
          <Field
            label="Audience"
            rows={5}
            value={draft.audience}
            onChange={(v) => set("audience", v)}
          />
          <Field label="Tone of voice" rows={3} value={draft.tone} onChange={(v) => set("tone", v)} />
        </section>

        <section className="glass space-y-5 rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Message pillars</h2>
          <ListField
            label="Value props"
            items={draft.value_props}
            onChange={(v) => set("value_props", v)}
          />
          <ListField
            label="Objections & answers"
            items={draft.objections}
            onChange={(v) => set("objections", v)}
          />
          <ListField label="Taglines" items={draft.taglines} onChange={(v) => set("taglines", v)} />
        </section>

        <section className="glass space-y-5 rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Ad copy</h2>
          <p className="text-xs text-muted-foreground">
            Sized for Google Ads: short headlines 30 characters, long headlines and descriptions 90.
          </p>
          <ListField
            label="Headlines"
            limit={30}
            items={draft.ad_headlines}
            onChange={(v) => set("ad_headlines", v)}
          />
          <ListField
            label="Long headlines"
            limit={90}
            items={draft.ad_long_headlines}
            onChange={(v) => set("ad_long_headlines", v)}
          />
          <ListField
            label="Descriptions"
            limit={90}
            items={draft.ad_descriptions}
            onChange={(v) => set("ad_descriptions", v)}
          />
        </section>

        <section className="glass space-y-5 rounded-3xl p-6">
          <h2 className="text-lg font-semibold">Search terms</h2>
          <ListField label="Keywords" items={draft.keywords} onChange={(v) => set("keywords", v)} />
          <ListField
            label="Negative keywords"
            hint="Searches the ads must never show for"
            items={draft.negative_keywords}
            onChange={(v) => set("negative_keywords", v)}
          />
        </section>
      </div>

      {draft.updated_at && (
        <p className="mt-6 text-xs text-muted-foreground">
          Last saved {new Date(draft.updated_at).toLocaleString()}
        </p>
      )}
    </Page>
  );
}

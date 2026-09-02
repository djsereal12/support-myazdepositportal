import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Page } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your account — deposit" },
      {
        name: "description",
        content: "Update your contact details, mailing address and landlord business info.",
      },
      { property: "og:title", content: "Your account — deposit" },
      { property: "og:description", content: "Manage your deposit account details." },
    ],
  }),
  component: ProfilePage,
});

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-lavender";

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {label}
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ProfilePage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: landlord } = useQuery({
    queryKey: ["landlord-profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landlord_profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [p, setP] = useState({
    full_name: "",
    phone: "",
    mailing_address: "",
    city: "",
    state: "AZ",
    postal_code: "",
    notify_email: true,
  });
  const [l, setL] = useState({
    company_name: "",
    contact_name: "",
    phone: "",
    license_number: "",
    mailing_address: "",
    city: "",
    state: "AZ",
    postal_code: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setP({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      mailing_address: profile.mailing_address ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "AZ",
      postal_code: profile.postal_code ?? "",
      notify_email: profile.notify_email ?? true,
    });
  }, [profile]);

  useEffect(() => {
    if (!landlord) return;
    setL({
      company_name: landlord.company_name ?? "",
      contact_name: landlord.contact_name ?? "",
      phone: landlord.phone ?? "",
      license_number: landlord.license_number ?? "",
      mailing_address: landlord.mailing_address ?? "",
      city: landlord.city ?? "",
      state: landlord.state ?? "AZ",
      postal_code: landlord.postal_code ?? "",
    });
  }, [landlord]);

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      const { error: pErr } = await supabase.from("profiles").update(p).eq("id", userId);
      if (pErr) throw pErr;
      const { error: lErr } = await supabase
        .from("landlord_profiles")
        .upsert({ user_id: userId, ...l }, { onConflict: "user_id" });
      if (lErr) throw lErr;
      toast.success("Account details saved");
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["landlord-profile", userId] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page>
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        Account
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Your details</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        These details are used on demand letters, landlord invites and report headers.
      </p>

      <section className="glass-panel mt-8 p-8">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-lavender" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold">Personal</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={p.full_name} onChange={(v) => setP({ ...p, full_name: v })} />
          <Field label="Phone" value={p.phone} onChange={(v) => setP({ ...p, phone: v })} />
          <Field
            label="Mailing address"
            value={p.mailing_address}
            onChange={(v) => setP({ ...p, mailing_address: v })}
          />
          <Field label="City" value={p.city} onChange={(v) => setP({ ...p, city: v })} />
          <Field label="State" value={p.state} onChange={(v) => setP({ ...p, state: v })} />
          <Field
            label="ZIP"
            value={p.postal_code}
            onChange={(v) => setP({ ...p, postal_code: v })}
          />
        </div>
        <label className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={p.notify_email}
            onChange={(e) => setP({ ...p, notify_email: e.target.checked })}
          />
          Email me when a landlord accepts or disputes a report
        </label>
      </section>

      <section className="glass-panel mt-6 p-8">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-lavender" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold">Landlord business</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Optional — fill this in if you manage rentals and send response letters.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field
            label="Company"
            value={l.company_name}
            onChange={(v) => setL({ ...l, company_name: v })}
          />
          <Field
            label="Contact name"
            value={l.contact_name}
            onChange={(v) => setL({ ...l, contact_name: v })}
          />
          <Field label="Phone" value={l.phone} onChange={(v) => setL({ ...l, phone: v })} />
          <Field
            label="License #"
            value={l.license_number}
            onChange={(v) => setL({ ...l, license_number: v })}
          />
          <Field
            label="Mailing address"
            value={l.mailing_address}
            onChange={(v) => setL({ ...l, mailing_address: v })}
          />
          <Field label="City" value={l.city} onChange={(v) => setL({ ...l, city: v })} />
          <Field label="State" value={l.state} onChange={(v) => setL({ ...l, state: v })} />
          <Field
            label="ZIP"
            value={l.postal_code}
            onChange={(v) => setL({ ...l, postal_code: v })}
          />
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save details"}
      </button>
    </Page>
  );
}

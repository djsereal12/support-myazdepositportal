import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Page } from "@/components/site-shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/properties/new")({
  head: () => ({
    meta: [
      { title: "Add a property — DEPOSIT" },
      { name: "description", content: "Add the unit, landlord contact and deposit amount you're protecting." },
      { property: "og:title", content: "Add a property — DEPOSIT" },
      { property: "og:description", content: "Start documenting a new rental unit." },
    ],
  }),
  component: NewProperty,
});

const schema = z.object({
  address: z.string().trim().min(4, "Enter the street address").max(200),
  unit: z.string().trim().max(40).optional(),
  landlord_name: z.string().trim().max(120).optional(),
  landlord_email: z.union([z.string().trim().email("Invalid landlord email").max(255), z.literal("")]),
  deposit_amount: z.number().min(0).max(1_000_000),
  lease_start: z.string().optional(),
  lease_end: z.string().optional(),
});

function NewProperty() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    address: "",
    unit: "",
    landlord_name: "",
    landlord_email: "",
    deposit_amount: "",
    lease_start: "",
    lease_end: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      deposit_amount: Number(form.deposit_amount || 0),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("properties")
      .insert({
        user_id: userData.user!.id,
        address: parsed.data.address,
        unit: parsed.data.unit || null,
        landlord_name: parsed.data.landlord_name || null,
        landlord_email: parsed.data.landlord_email || null,
        deposit_amount: parsed.data.deposit_amount,
        lease_start: form.lease_start || null,
        lease_end: form.lease_end || null,
      })
      .select()
      .single();
    setBusy(false);
    if (error || !data) {
      toast.error(error?.message ?? "Could not save property");
      return;
    }
    toast.success("Property added");
    navigate({ to: "/properties/$propertyId", params: { propertyId: data.id } });
  }

  return (
    <Page>
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        Step 1 of 2
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Add a property</h1>
      <form onSubmit={submit} className="glass-panel mt-8 max-w-2xl space-y-5 p-8">
        <Field label="Street address" value={form.address} onChange={set("address")} placeholder="1420 E Camelback Rd" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Unit" value={form.unit} onChange={set("unit")} placeholder="Apt 312" />
          <Field
            label="Deposit amount (USD)"
            type="number"
            value={form.deposit_amount}
            onChange={set("deposit_amount")}
            placeholder="1800"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Landlord name" value={form.landlord_name} onChange={set("landlord_name")} placeholder="Sonoran Property Group" />
          <Field
            label="Landlord email"
            type="email"
            value={form.landlord_email}
            onChange={set("landlord_email")}
            placeholder="manager@example.com"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Lease start" type="date" value={form.lease_start} onChange={set("lease_start")} />
          <Field label="Lease end" type="date" value={form.lease_end} onChange={set("lease_end")} />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save property"}
        </button>
      </form>
    </Page>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

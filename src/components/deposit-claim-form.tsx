import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { submitDepositClaim } from "@/utils/deposit-claims.functions";

type Source = "pricing" | "auth";

const empty = {
  fullName: "",
  email: "",
  phone: "",
  rentalAddress: "",
  unit: "",
  city: "",
  landlordName: "",
  landlordEmail: "",
  depositAmount: "",
  amountWithheld: "",
  moveOutDate: "",
  disputeReason: "",
  details: "",
};

export function DepositClaimForm({ source = "pricing" }: { source?: Source }) {
  const submit = useServerFn(submitDepositClaim);
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function set(key: keyof typeof empty) {
    return (value: string) => setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const num = (v: string) => {
        const n = Number(v.replace(/[^0-9.]/g, ""));
        return v.trim() && Number.isFinite(n) ? n : null;
      };
      await submit({
        data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          rentalAddress: form.rentalAddress,
          unit: form.unit,
          city: form.city,
          landlordName: form.landlordName,
          landlordEmail: form.landlordEmail,
          depositAmount: num(form.depositAmount),
          amountWithheld: num(form.amountWithheld),
          moveOutDate: form.moveOutDate,
          disputeReason: form.disputeReason,
          details: form.details,
          source,
        },
      });
      setDone(true);
      setForm({ ...empty });
      toast.success("Claim received — we'll be in touch by email.");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section id="deposit-claim" className="glass-panel mt-14 p-8">
        <h2 className="text-2xl font-semibold">Claim received</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Thanks — your deposit claim is saved and our team has been notified. We'll reply to the
          email you gave us.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-6 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-accent"
        >
          Submit another claim
        </button>
      </section>
    );
  }

  return (
    <section id="deposit-claim" className="glass-panel mt-14 p-8">
      <h2 className="text-2xl font-semibold">Start a deposit claim</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Tell us about your rental and what was withheld. We store your claim securely and review
        every submission.
      </p>

      <form onSubmit={onSubmit} className="mt-7 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required value={form.fullName} onChange={set("fullName")} />
        <Field
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={set("email")}
          placeholder="you@email.com"
        />
        <Field label="Phone" value={form.phone} onChange={set("phone")} />
        <Field label="City" value={form.city} onChange={set("city")} placeholder="Phoenix" />
        <Field
          label="Rental address"
          required
          value={form.rentalAddress}
          onChange={set("rentalAddress")}
          className="sm:col-span-2"
        />
        <Field label="Unit" value={form.unit} onChange={set("unit")} />
        <Field
          label="Move-out date"
          type="date"
          value={form.moveOutDate}
          onChange={set("moveOutDate")}
        />
        <Field label="Landlord name" value={form.landlordName} onChange={set("landlordName")} />
        <Field
          label="Landlord email"
          type="email"
          value={form.landlordEmail}
          onChange={set("landlordEmail")}
        />
        <Field
          label="Deposit amount"
          value={form.depositAmount}
          onChange={set("depositAmount")}
          placeholder="1800"
        />
        <Field
          label="Amount withheld"
          value={form.amountWithheld}
          onChange={set("amountWithheld")}
          placeholder="1200"
        />
        <Field
          label="What happened?"
          required
          value={form.disputeReason}
          onChange={set("disputeReason")}
          placeholder="Deposit withheld for carpet wear"
          className="sm:col-span-2"
        />
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Details
          </span>
          <textarea
            rows={4}
            value={form.details}
            maxLength={2000}
            onChange={(e) => set("details")(e.target.value)}
            placeholder="Dates, photos you have, anything the landlord told you."
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            {busy ? "Sending…" : "Submit deposit claim"}
          </button>
          <p className="mt-3 text-xs text-muted-foreground">
            Submitting a claim is not legal advice and does not create an attorney-client
            relationship.
          </p>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        required={required ?? false}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

import { createFileRoute } from '@tanstack/react-router'
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Home, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/site-shell";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — deposit" },
      { name: "description", content: "Sign in or create your deposit account to start a tamper-proof move-in scan." },
      { property: "og:title", content: "Sign in — deposit" },
      { property: "og:description", content: "Access your Arizona deposit documentation." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  fullName: z.string().trim().max(100).optional(),
});

type Role = "tenant" | "landlord";

const roleDetails: Record<
  Role,
  { label: string; description: string; icon: React.ElementType; features: string[]; home: string }
> = {
  tenant: {
    label: "I'm a tenant",
    description: "Document your rental, protect your deposit, and request refunds.",
    icon: Home,
    features: ["Move-in / move-out scans", "Timestamped photo reports", "Arizona demand letters"],
    home: "/dashboard",
  },
  landlord: {
    label: "I'm a landlord",
    description: "View shared reports, dispute claims, and send response letters.",
    icon: ShieldCheck,
    features: ["Access tenant reports", "Dispute deposit deductions", "Professional response letters"],
    home: "/landlord",
  },
};

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("tenant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) redirectForRole(data.session.user.id);
    });
  }, [navigate]);

  async function redirectForRole(userId: string) {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1);
    const firstRole = roles?.[0]?.role as Role | undefined;
    navigate({ to: firstRole ? roleDetails[firstRole].home : "/dashboard", replace: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.fullName ?? "", role },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        if (data.user) {
          await redirectForRole(data.user.id);
          return;
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    try {
      sessionStorage.setItem("deposit:after-auth", roleDetails[role].home);
      sessionStorage.setItem("deposit:pending-role", role);
    } catch {
      /* ignore */
    }
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.error("Sign-in did not complete. Please try again.");
      return;
    }
    await redirectForRole(data.session.user.id);
  }

  const activeRole = roleDetails[role];

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-14">
      <div className="aurora pointer-events-none absolute inset-0 -z-10 opacity-80" />
      <div className="w-full max-w-lg">
        <div className="flex justify-center">
          <Logo />
        </div>

        <div className="glass-panel mt-8 p-8">
          <h1 className="text-center text-3xl font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to manage your deposit documentation."
              : "Two minutes now, up to $1,800 later."}
          </p>

          {/* Role selector */}
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {(Object.keys(roleDetails) as Role[]).map((r) => {
              const details = roleDetails[r];
              const Icon = details.icon;
              const active = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  aria-pressed={active}
                  className={`text-left rounded-2xl border p-5 transition-all ${
                    active
                      ? "border-lavender bg-lavender-soft/40 shadow-sm ring-1 ring-lavender"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        active ? "bg-lavender text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{details.label}</span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {details.description}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {details.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
                        <KeyRound className="h-3 w-3 text-lavender" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <button
            onClick={google}
            className="mt-7 w-full rounded-full border border-border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            Continue with Google as {activeRole.label.split(" ").slice(2).join(" ")}
          </button>

          <div className="my-6 flex items-center gap-4 text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" ? (
              <Field
                label="Full name"
                value={fullName}
                onChange={setFullName}
                placeholder="Jamie Rivera"
              />
            ) : null}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@email.com"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Working…" : mode === "signin" ? `Sign in as ${activeRole.label.split(" ").slice(2).join(" ")}` : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New to deposit?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-lavender-deep underline underline-offset-4"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline underline-offset-4">
            Back to home
          </Link>
        </p>
      </div>
    </div>
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

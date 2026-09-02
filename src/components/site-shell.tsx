import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-baseline gap-2 ${className}`}>
      <span className="font-script text-2xl leading-none text-lavender-deep">Deposit</span>
      <span className="hidden text-[0.6rem] font-medium uppercase tracking-[0.32em] text-muted-foreground sm:inline">
        Arizona
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user.email ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:mt-4 sm:rounded-full sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link to="/law" className="transition-colors hover:text-foreground">
            Arizona law
          </Link>
          {email ? (
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
          ) : null}
        </nav>
        {email ? (
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[9rem] truncate text-xs text-muted-foreground sm:inline">
              {email}
            </span>
            <button
              onClick={signOut}
              className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium transition-colors hover:bg-accent"
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="font-script text-lg text-lavender-deep">Deposit</span>
        <p className="max-w-md">
          Documentation software, not legal advice. Statute references are for informational
          purposes under A.R.S. § 33-1321.
        </p>
      </div>
    </footer>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="aurora pointer-events-none fixed inset-0 -z-10 opacity-70" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    move_in_complete: "bg-lavender-soft text-accent-foreground",
    in_progress: "bg-lavender-soft text-accent-foreground",
    complete: "bg-success/15 text-foreground",
    disputed: "bg-destructive/12 text-destructive",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {label}
    </span>
  );
}

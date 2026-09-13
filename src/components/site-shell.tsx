import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { AskWidget } from "@/components/ask-widget";
import logoWordmarkAsset from "@/assets/deposit-logo-wordmark.png.asset.json";
import logoSquareAsset from "@/assets/deposit-logo-square.png.asset.json";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" aria-label="deposit — Arizona" className={`flex items-center ${className}`}>
      <img
        src={logoWordmarkAsset.url}
        alt="deposit — Arizona"
        className="h-8 w-auto grayscale contrast-125"
        loading="eager"
      />
    </Link>
  );
}

export function FooterLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoSquareAsset.url}
      alt="deposit — Arizona logo"
      className={`w-36 grayscale contrast-125 ${className}`}
      loading="lazy"
    />
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
          <Link to="/sample" className="transition-colors hover:text-foreground">
            Sample report
          </Link>
          <Link to="/calculator" className="transition-colors hover:text-foreground">
            Calculator
          </Link>
          <Link to="/pricing" className="transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link to="/landlord-access" className="transition-colors hover:text-foreground">
            Landlord portal
          </Link>
          <Link to="/faq" className="transition-colors hover:text-foreground">
            Tenant FAQ
          </Link>
          <Link to="/ask" className="transition-colors hover:text-foreground">
            Ask
          </Link>
          <Link to="/law" className="transition-colors hover:text-foreground">
            Arizona law
          </Link>
          {email ? (
            <>
              <Link to="/dashboard" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/landlord" className="transition-colors hover:text-foreground">
                Landlord
              </Link>
              <Link to="/profile" className="transition-colors hover:text-foreground">
                Account
              </Link>
            </>
          ) : null}
        </nav>
        {email ? (
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[9rem] truncate text-xs text-muted-foreground sm:inline">
              {email}
            </span>
            <button onClick={signOut} className="btn-glass px-4 py-2 text-xs font-medium">
              Sign out
            </button>
          </div>
        ) : (
          <Link to="/auth" className="btn-glass-pink px-4 py-2 text-xs font-medium">
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
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 text-xs text-muted-foreground">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <FooterLogo />
            <p className="mt-2">
              Documentation software, not legal advice. Statute references are for informational
              purposes under A.R.S. § 33-1321.
            </p>
          </div>
          <NewsletterSignup />
        </div>
        <div className="grid gap-6 sm:grid-cols-4">
          <FooterCol title="Product">
            <Link to="/sample" className="transition-colors hover:text-foreground">
              Sample report
            </Link>
            <Link to="/calculator" className="transition-colors hover:text-foreground">
              Deadline calculator
            </Link>
            <Link to="/pricing" className="transition-colors hover:text-foreground">
              Pricing
            </Link>
          </FooterCol>
          <FooterCol title="Learn">
            <Link to="/law" className="transition-colors hover:text-foreground">
              Read the statute
            </Link>
            <Link to="/faq" className="transition-colors hover:text-foreground">
              Tenant FAQ
            </Link>
            <Link to="/landlord-access" className="transition-colors hover:text-foreground">
              Landlord portal
            </Link>
          </FooterCol>
          <FooterCol title="Legal">
            <Link to="/legal" className="transition-colors hover:text-foreground">
              Privacy policy
            </Link>
            <Link to="/legal" className="transition-colors hover:text-foreground">
              Terms of use
            </Link>
            <Link to="/legal" className="transition-colors hover:text-foreground">
              Disclaimer
            </Link>
          </FooterCol>
          <FooterCol title="Contact">
            <a
              href="mailto:support@myazdepositportal.live"
              className="transition-colors hover:text-foreground"
            >
              support@myazdepositportal.live
            </a>
            <span>Phoenix, Arizona</span>
          </FooterCol>
        </div>
        <p>© {new Date().getFullYear()} deposit. All rights reserved.</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-foreground/70">
        {title}
      </p>
      {children}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="aurora pointer-events-none fixed inset-0 -z-10 opacity-70" />
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">{children}</main>
      <SiteFooter />
      <AskWidget />
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

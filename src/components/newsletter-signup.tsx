import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { subscribeToMarketing } from "@/utils/marketing.functions";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const subscribe = useServerFn(subscribeToMarketing);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await subscribe({ data: { email, source: "website" } });
      setDone(true);
      setEmail("");
      toast.success("You're on the list — Arizona deposit tips are on the way.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="text-xs text-muted-foreground">
        Thanks — check your inbox for a welcome note. Unsubscribe any time.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "w-full max-w-sm" : "w-full max-w-md"}>
      {!compact && (
        <p className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-lavender" strokeWidth={1.5} />
          Arizona deposit tips, once a month
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-xl border border-border/70 bg-white/70 px-3 py-2 text-sm outline-none backdrop-blur focus:border-lavender"
        />
        <button
          type="submit"
          disabled={busy}
          className="glass-button rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {busy ? "…" : "Subscribe"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Deposit guides and Arizona law updates. No spam, unsubscribe in one click.
      </p>
    </form>
  );
}

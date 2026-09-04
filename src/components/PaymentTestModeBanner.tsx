const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive">
        Production checkout is not configured yet. Complete payment go-live to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full rounded-2xl border border-border bg-lavender-soft px-4 py-2 text-center text-xs text-accent-foreground">
        All payments in the preview are in test mode. Use card 4242 4242 4242 4242.
      </div>
    );
  }
  return null;
}

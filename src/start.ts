import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  if (new URL(request.url).pathname.startsWith("/lovable/")) {
    return next();
  }
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Browser-enforced hardening: clickjacking, MIME sniffing, referrer leakage,
// HTTPS downgrade and unwanted device-API access.
const securityHeadersMiddleware = createMiddleware().server(async ({ next, request }) => {
  const result = await next();
  const { pathname } = new URL(request.url);
  const headers = (result as unknown as { response?: Response }).response?.headers;
  if (pathname.startsWith("/lovable/") || !headers) return result;
  const set = (name: string, value: string) => {
    if (!headers.has(name)) headers.set(name, value);
  };
  set("X-Content-Type-Options", "nosniff");
  set("X-Frame-Options", "SAMEORIGIN");
  set("Referrer-Policy", "strict-origin-when-cross-origin");
  set("Permissions-Policy", "geolocation=(self), camera=(self), microphone=(), payment=(self)");
  set("Cross-Origin-Opener-Policy", "same-origin");
  set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Kept permissive enough for SSR inline bootstrap, Stripe and the backend,
  // while blocking plugin content, hostile framing and base-tag injection.
  set(
    "Content-Security-Policy",
    [
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "upgrade-insecure-requests",
    ].join("; "),
  );
  return result;
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware, securityHeadersMiddleware],
}));


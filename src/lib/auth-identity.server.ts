import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";

export type VerifiedIdentity = { userId: string; email?: string } | null;

/**
 * Resolves the caller's identity from the verified Supabase bearer token.
 * Returns null for anonymous (guest) callers. Never trusts client-supplied ids.
 */
export async function resolveVerifiedIdentity(): Promise<VerifiedIdentity> {
  const SUPABASE_URL = process.env["SUPABASE_URL"];
  const SUPABASE_PUBLISHABLE_KEY = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token || token.split(".").length !== 3) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const email = typeof claims["email"] === "string" ? (claims["email"] as string) : undefined;
  return { userId: claims.sub as string, ...(email ? { email } : {}) };
}

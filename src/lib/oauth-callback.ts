import { supabase } from "@/integrations/supabase/client";

export type OAuthCallbackResult =
  | { status: "none" }
  | { status: "signed_in" }
  | { status: "error"; message: string };

function readTokens(): {
  access_token?: string | undefined;
  refresh_token?: string | undefined;
  error?: string | undefined;
  error_description?: string | undefined;
} | null {
  if (typeof window === "undefined") return null;
  const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const fromQuery = new URLSearchParams(window.location.search);
  const pick = (key: string) => fromHash.get(key) ?? fromQuery.get(key) ?? undefined;
  const access_token = pick("access_token");
  const refresh_token = pick("refresh_token");
  const error = pick("error");
  if (!access_token && !refresh_token && !error) return null;
  return {
    access_token,
    refresh_token,
    error,
    error_description: pick("error_description"),
  };
}

function cleanUrl() {
  if (typeof window === "undefined") return;
  window.history.replaceState({}, "", window.location.pathname);
}

/**
 * Consumes OAuth tokens returned in the URL after a full-page provider redirect.
 * The popup / web_message flow sets the session itself, so this is a no-op there.
 */
export async function consumeOAuthRedirect(): Promise<OAuthCallbackResult> {
  const params = readTokens();
  if (!params) return { status: "none" };

  if (params.error || !params.access_token || !params.refresh_token) {
    cleanUrl();
    return {
      status: "error",
      message: params.error_description ?? params.error ?? "Sign-in did not complete",
    };
  }

  const { error } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  });
  cleanUrl();
  if (error) return { status: "error", message: error.message };
  return { status: "signed_in" };
}

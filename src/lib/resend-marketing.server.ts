/**
 * Resend Broadcasts client used for marketing email only.
 * Marketing traffic is intentionally kept on its own sending subdomain so a
 * campaign complaint can never damage the reputation of the transactional
 * domain used for auth, invites and report notifications.
 */

// Calls route through the Lovable connector gateway — direct api.resend.com
// fetches from the server runtime get blocked (Cloudflare 403 / 1010).
const GATEWAY = "https://connector-gateway.lovable.dev/resend";
export const AUDIENCE_NAME = "deposit — Arizona tenants";

function gatewayAuth() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const resendKey = process.env["RESEND_API_KEY"];
  if (!lovableKey || !resendKey) {
    throw new Error("Marketing email is not configured yet (missing Resend connection).");
  }
  return { lovableKey, resendKey };
}

export function marketingFrom() {
  return process.env["MARKETING_FROM_EMAIL"] ?? "deposit <news@news.myazdepositportal.live>";
}

export function marketingReplyTo() {
  return process.env["MARKETING_REPLY_TO"] ?? "support@myazdepositportal.live";
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const { lovableKey, resendKey } = gatewayAuth();
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Resend request failed [${res.status}] ${path}: ${text}`);
    let message = text;
    try {
      message = (JSON.parse(text) as { message?: string }).message ?? text;
    } catch {
      /* keep raw text */
    }
    throw new Error(`Resend: ${message}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export async function ensureAudience(): Promise<string> {
  const configured = process.env["RESEND_AUDIENCE_ID"];
  if (configured) return configured;

  const list = await call<{ data?: { id: string; name: string }[] }>("/audiences");
  const found = (list.data ?? []).find((a) => a.name === AUDIENCE_NAME);
  if (found) return found.id;

  const created = await call<{ id: string }>("/audiences", {
    method: "POST",
    body: JSON.stringify({ name: AUDIENCE_NAME }),
  });
  return created.id;
}

export async function upsertContact(input: {
  audienceId: string;
  email: string;
  firstName?: string | null;
  unsubscribed?: boolean;
}): Promise<string | null> {
  const body = JSON.stringify({
    email: input.email,
    first_name: input.firstName ?? undefined,
    unsubscribed: input.unsubscribed ?? false,
  });
  try {
    const created = await call<{ id: string }>(`/audiences/${input.audienceId}/contacts`, {
      method: "POST",
      body,
    });
    return created.id ?? null;
  } catch (e) {
    // Contact already exists — patch it instead.
    await call(`/audiences/${input.audienceId}/contacts/${encodeURIComponent(input.email)}`, {
      method: "PATCH",
      body,
    }).catch(() => {
      throw e;
    });
    return null;
  }
}

export async function createBroadcast(input: {
  audienceId: string;
  subject: string;
  html: string;
  text: string;
  previewText?: string | null;
  name: string;
}): Promise<string> {
  const created = await call<{ id: string }>("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      audience_id: input.audienceId,
      from: marketingFrom(),
      reply_to: marketingReplyTo(),
      subject: input.subject,
      name: input.name,
      preview_text: input.previewText ?? undefined,
      html: input.html,
      text: input.text,
    }),
  });
  return created.id;
}

export async function sendBroadcast(broadcastId: string) {
  await call(`/broadcasts/${broadcastId}/send`, { method: "POST", body: JSON.stringify({}) });
}

export async function sendPreviewEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl?: string;
}) {
  await call("/emails", {
    method: "POST",
    body: JSON.stringify({
      from: marketingFrom(),
      reply_to: marketingReplyTo(),
      to: [input.to],
      subject: `[Test] ${input.subject}`,
      html: input.html,
      text: input.text,
      // Gmail/Yahoo require a working list-unsubscribe on bulk mail.
      ...(input.unsubscribeUrl
        ? {
            headers: {
              "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }
        : {}),
    }),
  });
}

/** One-off marketing send to a single address (ads, re-engagement). */
export async function sendMarketingEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
}) {
  return call<{ id: string }>("/emails", {
    method: "POST",
    body: JSON.stringify({
      from: marketingFrom(),
      reply_to: marketingReplyTo(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: {
        "List-Unsubscribe": `<${input.unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
}

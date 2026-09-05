/**
 * Signed one-click unsubscribe links for marketing email.
 * The token is an HMAC over the lowercased address, so a link can never be
 * used to unsubscribe someone else's address and needs no database lookup.
 */
import { createHmac, timingSafeEqual } from "crypto";

export const SITE_URL = "https://www.myazdepositportal.live";

function secret() {
  const value = process.env["MARKETING_UNSUBSCRIBE_SECRET"];
  if (!value) throw new Error("Unsubscribe signing secret is not configured");
  return value;
}

function sign(email: string) {
  return createHmac("sha256", secret()).update(email).digest("base64url");
}

export function unsubscribeToken(email: string) {
  const normalized = email.trim().toLowerCase();
  return `${Buffer.from(normalized, "utf8").toString("base64url")}.${sign(normalized)}`;
}

export function unsubscribeUrl(email: string) {
  return `${SITE_URL}/unsubscribe?token=${encodeURIComponent(unsubscribeToken(email))}`;
}

/** Returns the email when the token signature is valid, otherwise null. */
export function verifyUnsubscribeToken(token: string): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  let email: string;
  try {
    email = Buffer.from(encoded, "base64url").toString("utf8").trim().toLowerCase();
  } catch {
    return null;
  }
  if (!email || email.length > 254) return null;
  const expected = Buffer.from(sign(email));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length) return null;
  return timingSafeEqual(expected, provided) ? email : null;
}

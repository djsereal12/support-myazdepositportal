const SITE = "https://www.myazdepositportal.live";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type CampaignContent = {
  headline?: string | null;
  body: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  previewText?: string | null;
};

/** Renders the campaign into brand-consistent HTML with Resend's unsubscribe token. */
/** Turns bare URLs and email addresses in campaign copy into real links. */
function linkify(escaped: string) {
  return escaped
    .replace(
      /(https?:\/\/[^\s<]+[^\s<.,;:!?)"'])/g,
      '<a href="$1" style="color:#7c5cc4;text-decoration:underline;">$1</a>',
    )
    .replace(
      /(^|[\s(])([\w.+-]+@[\w-]+\.[\w.-]{2,})/g,
      '$1<a href="mailto:$2" style="color:#7c5cc4;text-decoration:underline;">$2</a>',
    );
}

export function renderCampaignHtml(
  c: CampaignContent,
  unsubscribeUrl = "{{{RESEND_UNSUBSCRIBE_URL}}}",
) {
  const paragraphs = c.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#2c2733;">${linkify(
          escapeHtml(p),
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");

  const cta =
    c.ctaLabel && c.ctaUrl
      ? `<div style="margin:28px 0 8px;"><a href="${escapeHtml(c.ctaUrl)}" style="display:inline-block;background:#7c5cc4;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 26px;border-radius:14px;">${escapeHtml(
          c.ctaLabel,
        )}</a></div>`
      : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;background-color:#ffffff;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(c.previewText ?? "")}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf9fc;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #ece9f2;border-radius:20px;">
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-size:26px;color:#7c5cc4;font-family:Georgia,'Times New Roman',serif;font-style:italic;">deposit</div>
        </td></tr>
        <tr><td style="padding:8px 32px 32px;">
          ${c.headline ? `<h1 style="margin:8px 0 18px;font-size:24px;line-height:1.25;color:#141019;">${escapeHtml(c.headline)}</h1>` : ""}
          ${paragraphs}
          ${cta}
        </td></tr>
        <tr><td style="padding:0 32px 30px;">
          <hr style="border:none;border-top:1px solid #ece9f2;margin:0 0 16px;" />
          <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:#8a8494;">
            deposit helps Arizona renters document move-in and move-out condition under A.R.S. § 33-1321.
            This is documentation software, not legal advice.
          </p>
          <p style="margin:0;font-size:12px;color:#8a8494;">
            You are receiving this because you signed up at
            <a href="${SITE}" style="color:#7c5cc4;">myazdepositportal.live</a>.
            <a href="${unsubscribeUrl}" style="color:#8a8494;text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function renderCampaignText(
  c: CampaignContent,
  unsubscribeUrl = "{{{RESEND_UNSUBSCRIBE_URL}}}",
) {
  return [
    c.headline ?? "",
    "",
    c.body,
    c.ctaLabel && c.ctaUrl ? `\n${c.ctaLabel}: ${c.ctaUrl}` : "",
    "",
    "deposit — Arizona move-in / move-out documentation. Not legal advice.",
    `Unsubscribe: ${unsubscribeUrl}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

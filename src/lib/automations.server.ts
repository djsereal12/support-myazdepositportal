import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const APP_URL = "https://myazdepositportal.live";

export type AutomationResult = {
  ran_at: string;
  sent: Record<string, number>;
  skipped: number;
  errors: string[];
};

type Admin = Awaited<
  ReturnType<typeof import("@/integrations/supabase/client.server").then>
> extends never
  ? any
  : any;

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Records that an automation email went out. Returns false when this exact
 * automation was already sent to this person for this reference, so a rerun of
 * the cron job never emails anyone twice.
 */
async function claim(
  supabaseAdmin: Admin,
  automation: string,
  opts: { userId?: string | null; email?: string | null; refId?: string | null },
): Promise<boolean> {
  const { error } = await supabaseAdmin.from("email_automation_sends").insert({
    automation,
    user_id: opts.userId ?? null,
    email: opts.email ?? null,
    ref_id: opts.refId ?? null,
  });
  if (error) return false; // unique violation == already sent
  return true;
}

async function release(
  supabaseAdmin: Admin,
  automation: string,
  opts: { userId?: string | null; refId?: string | null },
) {
  let q = supabaseAdmin.from("email_automation_sends").delete().eq("automation", automation);
  if (opts.userId) q = q.eq("user_id", opts.userId);
  if (opts.refId) q = q.eq("ref_id", opts.refId);
  await q;
}

/**
 * Runs every scheduled tenant email. Safe to call repeatedly — each send is
 * claimed first and only actually sent once.
 */
export async function runEmailAutomations(): Promise<AutomationResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const result: AutomationResult = {
    ran_at: new Date().toISOString(),
    sent: { nudge_no_property: 0, nudge_unsealed: 0, moveout_deadline: 0 },
    skipped: 0,
    errors: [],
  };

  const send = async (
    automation: string,
    key: { userId?: string | null; refId?: string | null },
    template: string,
    to: string,
    templateData: Record<string, unknown>,
    counter: keyof AutomationResult["sent"],
  ) => {
    const claimed = await claim(supabaseAdmin, automation, { ...key, email: to });
    if (!claimed) {
      result.skipped += 1;
      return;
    }
    try {
      const outcome = await sendTemplateEmail(template, to, {
        templateData,
        idempotencyKey: `${automation}-${key.refId ?? key.userId}`,
      });
      if (outcome.sent) result.sent[counter] += 1;
      else result.skipped += 1;
    } catch (e) {
      await release(supabaseAdmin, automation, key);
      result.errors.push(`${automation}: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // 1. Signed up 2+ days ago, still has no property.
  try {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, notify_email, created_at")
      .lt("created_at", daysAgo(2))
      .gt("created_at", daysAgo(30))
      .limit(200);

    for (const profile of profiles ?? []) {
      if (!profile.email || profile.notify_email === false) continue;
      const { count } = await supabaseAdmin
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id);
      if ((count ?? 0) > 0) continue;
      await send(
        "nudge_no_property",
        { userId: profile.id, refId: profile.id },
        "nudge-first-scan",
        profile.email,
        { name: profile.full_name, variant: "no_property", appUrl: APP_URL },
        "nudge_no_property",
      );
    }
  } catch (e) {
    result.errors.push(`nudge_no_property: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Scan started over 24h ago and never sealed.
  try {
    const { data: reports } = await supabaseAdmin
      .from("reports")
      .select("id, user_id, property_id, status, created_at")
      .eq("status", "in_progress")
      .lt("created_at", daysAgo(1))
      .gt("created_at", daysAgo(45))
      .limit(200);

    for (const report of reports ?? []) {
      const [{ data: profile }, { data: property }] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("email, full_name, notify_email")
          .eq("id", report.user_id)
          .maybeSingle(),
        report.property_id
          ? supabaseAdmin
              .from("properties")
              .select("address, unit")
              .eq("id", report.property_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      if (!profile?.email || profile.notify_email === false) continue;
      const address = property
        ? [property.address, property.unit].filter(Boolean).join(", ")
        : null;
      await send(
        "nudge_unsealed",
        { userId: report.user_id, refId: report.id },
        "nudge-first-scan",
        profile.email,
        {
          name: profile.full_name,
          variant: "unsealed",
          address,
          reportId: report.id,
          appUrl: APP_URL,
        },
        "nudge_unsealed",
      );
    }
  } catch (e) {
    result.errors.push(`nudge_unsealed: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Lease ends within 21 days — time to plan the move-out scan.
  try {
    const today = new Date();
    const horizon = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const { data: properties } = await supabaseAdmin
      .from("properties")
      .select("id, user_id, address, unit, lease_end")
      .not("lease_end", "is", null)
      .gte("lease_end", iso(today))
      .lte("lease_end", iso(horizon))
      .limit(200);

    for (const property of properties ?? []) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email, full_name, notify_email")
        .eq("id", property.user_id)
        .maybeSingle();
      if (!profile?.email || profile.notify_email === false) continue;
      await send(
        "moveout_deadline",
        { userId: property.user_id, refId: property.id },
        "moveout-deadline",
        profile.email,
        {
          name: profile.full_name,
          address: [property.address, property.unit].filter(Boolean).join(", "),
          leaseEnd: property.lease_end
            ? new Date(`${property.lease_end}T12:00:00Z`).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })
            : null,
          propertyId: property.id,
          appUrl: APP_URL,
        },
        "moveout_deadline",
      );
    }
  } catch (e) {
    result.errors.push(`moveout_deadline: ${e instanceof Error ? e.message : String(e)}`);
  }

  return result;
}

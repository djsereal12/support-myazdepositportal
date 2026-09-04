import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_MARKETING_PROFILE, type MarketingProfile } from "@/lib/marketing-profile";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("is_admin", { _user_id: userId });
  if (error) throw new Error("Unable to verify permissions");
  if (!data) throw new Error("Forbidden");
}

function toStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function normalize(row: Record<string, any> | null): MarketingProfile {
  if (!row) return DEFAULT_MARKETING_PROFILE;
  const filled = (value: string | null | undefined, fallback: string) =>
    value && value.trim() ? value : fallback;
  const list = (value: unknown, fallback: string[]) => {
    const parsed = toStrings(value);
    return parsed.length ? parsed : fallback;
  };
  return {
    brand_name: filled(row["brand_name"], DEFAULT_MARKETING_PROFILE.brand_name),
    one_liner: filled(row["one_liner"], DEFAULT_MARKETING_PROFILE.one_liner),
    positioning: filled(row["positioning"], DEFAULT_MARKETING_PROFILE.positioning),
    audience: filled(row["audience"], DEFAULT_MARKETING_PROFILE.audience),
    tone: filled(row["tone"], DEFAULT_MARKETING_PROFILE.tone),
    value_props: list(row["value_props"], DEFAULT_MARKETING_PROFILE.value_props),
    objections: list(row["objections"], DEFAULT_MARKETING_PROFILE.objections),
    taglines: list(row["taglines"], DEFAULT_MARKETING_PROFILE.taglines),
    ad_headlines: list(row["ad_headlines"], DEFAULT_MARKETING_PROFILE.ad_headlines),
    ad_long_headlines: list(
      row["ad_long_headlines"],
      DEFAULT_MARKETING_PROFILE.ad_long_headlines,
    ),
    ad_descriptions: list(row["ad_descriptions"], DEFAULT_MARKETING_PROFILE.ad_descriptions),
    keywords: list(row["keywords"], DEFAULT_MARKETING_PROFILE.keywords),
    negative_keywords: list(
      row["negative_keywords"],
      DEFAULT_MARKETING_PROFILE.negative_keywords,
    ),
    updated_at: row["updated_at"] ?? null,
  };
}

export const getMarketingProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MarketingProfile> => {
    await assertAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("marketing_profile")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    return normalize(data as Record<string, any> | null);
  });

export const saveMarketingProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: MarketingProfile) => input)
  .handler(async ({ data, context }): Promise<MarketingProfile> => {
    await assertAdmin(context.supabase, context.userId);
    const payload = {
      id: "default",
      brand_name: data.brand_name ?? "deposit",
      one_liner: data.one_liner ?? "",
      positioning: data.positioning ?? "",
      audience: data.audience ?? "",
      tone: data.tone ?? "",
      value_props: toStrings(data.value_props),
      objections: toStrings(data.objections),
      taglines: toStrings(data.taglines),
      ad_headlines: toStrings(data.ad_headlines).map((h) => h.slice(0, 30)),
      ad_long_headlines: toStrings(data.ad_long_headlines).map((h) => h.slice(0, 90)),
      ad_descriptions: toStrings(data.ad_descriptions).map((h) => h.slice(0, 90)),
      keywords: toStrings(data.keywords),
      negative_keywords: toStrings(data.negative_keywords),
      updated_by: context.userId,
    };
    const { data: saved, error } = await context.supabase
      .from("marketing_profile")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return normalize(saved as Record<string, any> | null);
  });

export const resetMarketingProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MarketingProfile> => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("marketing_profile")
      .upsert(
        { id: "default", ...DEFAULT_MARKETING_PROFILE, updated_by: context.userId },
        { onConflict: "id" },
      );
    if (error) throw new Error(error.message);
    return DEFAULT_MARKETING_PROFILE;
  });

CREATE TABLE public.marketing_profile (
  id text PRIMARY KEY DEFAULT 'default',
  brand_name text NOT NULL DEFAULT 'deposit',
  one_liner text NOT NULL DEFAULT '',
  positioning text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT '',
  value_props jsonb NOT NULL DEFAULT '[]'::jsonb,
  objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  taglines jsonb NOT NULL DEFAULT '[]'::jsonb,
  ad_headlines jsonb NOT NULL DEFAULT '[]'::jsonb,
  ad_long_headlines jsonb NOT NULL DEFAULT '[]'::jsonb,
  ad_descriptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  negative_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketing_profile_singleton CHECK (id = 'default')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_profile TO authenticated;
GRANT ALL ON public.marketing_profile TO service_role;

ALTER TABLE public.marketing_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage marketing profile"
  ON public.marketing_profile FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER set_marketing_profile_updated_at
  BEFORE UPDATE ON public.marketing_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.marketing_profile (id) VALUES ('default') ON CONFLICT DO NOTHING;

CREATE TABLE public.email_automation_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation text NOT NULL,
  user_id uuid,
  email text,
  ref_id text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX email_automation_sends_unique
  ON public.email_automation_sends (automation, coalesce(user_id::text, email), coalesce(ref_id, 'none'));

GRANT SELECT ON public.email_automation_sends TO authenticated;
GRANT ALL ON public.email_automation_sends TO service_role;

ALTER TABLE public.email_automation_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read automation sends"
  ON public.email_automation_sends FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "No client writes on automation sends"
  ON public.email_automation_sends AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
-- Roles
CREATE TYPE public.app_role AS ENUM ('tenant', 'landlord');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own roles insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Shares from tenant to landlord
CREATE TABLE public.report_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  landlord_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, landlord_email)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_shares TO authenticated;
GRANT ALL ON public.report_shares TO service_role;
ALTER TABLE public.report_shares ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_email()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', ''));
$$;

CREATE OR REPLACE FUNCTION public.landlord_can_view_report(_report_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_email() <> '' AND (
    EXISTS (
      SELECT 1 FROM public.reports r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = _report_id AND lower(coalesce(p.landlord_email, '')) = public.current_email()
    )
    OR EXISTS (
      SELECT 1 FROM public.report_shares s
      WHERE s.report_id = _report_id AND lower(s.landlord_email) = public.current_email()
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.landlord_can_view_property(_property_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_email() <> '' AND (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = _property_id AND lower(coalesce(p.landlord_email, '')) = public.current_email()
    )
    OR EXISTS (
      SELECT 1 FROM public.report_shares s
      WHERE s.property_id = _property_id AND lower(s.landlord_email) = public.current_email()
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.report_owner(_report_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id FROM public.reports WHERE id = _report_id;
$$;

CREATE POLICY "tenant manages shares" ON public.report_shares FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "landlord reads own shares" ON public.report_shares FOR SELECT TO authenticated
  USING (lower(landlord_email) = public.current_email());

-- Landlord read access to shared data
CREATE POLICY "landlord reads shared reports" ON public.reports FOR SELECT TO authenticated
  USING (public.landlord_can_view_report(id));
CREATE POLICY "landlord reads shared properties" ON public.properties FOR SELECT TO authenticated
  USING (public.landlord_can_view_property(id));
CREATE POLICY "landlord reads shared media" ON public.media FOR SELECT TO authenticated
  USING (public.landlord_can_view_report(report_id));

-- Disputes filed by landlords
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL DEFAULT auth.uid(),
  tenant_id uuid,
  amount_claimed numeric NOT NULL DEFAULT 0,
  reason text,
  items text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.disputes TO authenticated;
GRANT ALL ON public.disputes TO service_role;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "landlord manages own disputes" ON public.disputes FOR ALL TO authenticated
  USING (auth.uid() = landlord_id AND public.landlord_can_view_report(report_id))
  WITH CHECK (auth.uid() = landlord_id AND public.landlord_can_view_report(report_id));
CREATE POLICY "tenant reads disputes on own reports" ON public.disputes FOR SELECT TO authenticated
  USING (public.report_owner(report_id) = auth.uid());

-- Landlord response letters
CREATE TABLE public.landlord_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL DEFAULT auth.uid(),
  dispute_id uuid REFERENCES public.disputes(id) ON DELETE SET NULL,
  amount_withheld numeric NOT NULL DEFAULT 0,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.landlord_letters TO authenticated;
GRANT ALL ON public.landlord_letters TO service_role;
ALTER TABLE public.landlord_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "landlord manages own letters" ON public.landlord_letters FOR ALL TO authenticated
  USING (auth.uid() = landlord_id AND public.landlord_can_view_report(report_id))
  WITH CHECK (auth.uid() = landlord_id AND public.landlord_can_view_report(report_id));
CREATE POLICY "tenant reads letters on own reports" ON public.landlord_letters FOR SELECT TO authenticated
  USING (public.report_owner(report_id) = auth.uid());

-- Purchases (one-time payments)
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  price_id text NOT NULL,
  product_id text,
  stripe_session_id text NOT NULL UNIQUE,
  stripe_customer_id text,
  amount_total numeric,
  currency text,
  status text NOT NULL DEFAULT 'pending',
  environment text NOT NULL DEFAULT 'sandbox',
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchases_user ON public.purchases(user_id);
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchases select" ON public.purchases FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
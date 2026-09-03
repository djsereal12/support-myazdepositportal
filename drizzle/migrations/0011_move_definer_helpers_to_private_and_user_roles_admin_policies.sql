-- 1) Private schema for SECURITY DEFINER helpers (not exposed via the Data API)
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA app_private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION app_private.current_email()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT lower(u.email)
  FROM auth.users u
  WHERE u.id = auth.uid()
    AND u.email_confirmed_at IS NOT NULL
    AND u.email IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION app_private.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION app_private.report_owner(_report_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT user_id FROM public.reports WHERE id = _report_id;
$$;

CREATE OR REPLACE FUNCTION app_private.landlord_can_view_property(_property_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT app_private.current_email() <> '' AND (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = _property_id AND lower(coalesce(p.landlord_email, '')) = app_private.current_email()
    )
    OR EXISTS (
      SELECT 1 FROM public.report_shares s
      WHERE s.property_id = _property_id AND lower(s.landlord_email) = app_private.current_email()
    )
  );
$$;

CREATE OR REPLACE FUNCTION app_private.landlord_can_view_report(_report_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT app_private.current_email() <> '' AND (
    EXISTS (
      SELECT 1 FROM public.reports r
      JOIN public.properties p ON p.id = r.property_id
      WHERE r.id = _report_id AND lower(coalesce(p.landlord_email, '')) = app_private.current_email()
    )
    OR EXISTS (
      SELECT 1 FROM public.report_shares s
      WHERE s.report_id = _report_id AND lower(s.landlord_email) = app_private.current_email()
    )
  );
$$;

REVOKE ALL ON FUNCTION app_private.current_email(), app_private.is_admin(uuid),
  app_private.report_owner(uuid), app_private.landlord_can_view_property(uuid),
  app_private.landlord_can_view_report(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.current_email(), app_private.is_admin(uuid),
  app_private.report_owner(uuid), app_private.landlord_can_view_property(uuid),
  app_private.landlord_can_view_report(uuid) TO authenticated, service_role;

-- 2) Repoint policies at the private helpers
DROP POLICY IF EXISTS "landlord reads shared properties" ON public.properties;
CREATE POLICY "landlord reads shared properties" ON public.properties
  FOR SELECT TO authenticated USING (app_private.landlord_can_view_property(id));

DROP POLICY IF EXISTS "landlord reads shared media" ON public.media;
CREATE POLICY "landlord reads shared media" ON public.media
  FOR SELECT TO authenticated USING (app_private.landlord_can_view_report(report_id));

DROP POLICY IF EXISTS "landlord reads own shares" ON public.report_shares;
CREATE POLICY "landlord reads own shares" ON public.report_shares
  FOR SELECT TO authenticated USING (lower(landlord_email) = app_private.current_email());

DROP POLICY IF EXISTS "landlord reads shared reports" ON public.reports;
CREATE POLICY "landlord reads shared reports" ON public.reports
  FOR SELECT TO authenticated USING (app_private.landlord_can_view_report(id));

DROP POLICY IF EXISTS "landlord manages own disputes" ON public.disputes;
CREATE POLICY "landlord manages own disputes" ON public.disputes
  FOR ALL TO authenticated
  USING (auth.uid() = landlord_id AND app_private.landlord_can_view_report(report_id))
  WITH CHECK (auth.uid() = landlord_id AND app_private.landlord_can_view_report(report_id));

DROP POLICY IF EXISTS "tenant reads disputes on own reports" ON public.disputes;
CREATE POLICY "tenant reads disputes on own reports" ON public.disputes
  FOR SELECT TO authenticated USING (app_private.report_owner(report_id) = auth.uid());

DROP POLICY IF EXISTS "landlord manages own letters" ON public.landlord_letters;
CREATE POLICY "landlord manages own letters" ON public.landlord_letters
  FOR ALL TO authenticated
  USING (auth.uid() = landlord_id AND app_private.landlord_can_view_report(report_id))
  WITH CHECK (auth.uid() = landlord_id AND app_private.landlord_can_view_report(report_id));

DROP POLICY IF EXISTS "tenant reads letters on own reports" ON public.landlord_letters;
CREATE POLICY "tenant reads letters on own reports" ON public.landlord_letters
  FOR SELECT TO authenticated USING (app_private.report_owner(report_id) = auth.uid());

DROP POLICY IF EXISTS "tenant manages own invites" ON public.landlord_invites;
CREATE POLICY "tenant manages own invites" ON public.landlord_invites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND app_private.report_owner(report_id) = auth.uid());

DROP POLICY IF EXISTS "landlord reads invites on shared reports" ON public.landlord_invites;
CREATE POLICY "landlord reads invites on shared reports" ON public.landlord_invites
  FOR SELECT TO authenticated USING (app_private.landlord_can_view_report(report_id));

DROP POLICY IF EXISTS "tenant reads thread on own reports" ON public.invite_messages;
CREATE POLICY "tenant reads thread on own reports" ON public.invite_messages
  FOR SELECT TO authenticated USING (app_private.report_owner(report_id) = auth.uid());

DROP POLICY IF EXISTS "tenant writes thread on own reports" ON public.invite_messages;
CREATE POLICY "tenant writes thread on own reports" ON public.invite_messages
  FOR INSERT TO authenticated
  WITH CHECK (app_private.report_owner(report_id) = auth.uid() AND author_role = 'tenant');

DROP POLICY IF EXISTS "landlord reads thread on shared reports" ON public.invite_messages;
CREATE POLICY "landlord reads thread on shared reports" ON public.invite_messages
  FOR SELECT TO authenticated USING (app_private.landlord_can_view_report(report_id));

DROP POLICY IF EXISTS "admins read landlord profiles" ON public.landlord_profiles;
CREATE POLICY "admins read landlord profiles" ON public.landlord_profiles
  FOR SELECT TO authenticated USING (app_private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admins read profiles" ON public.profiles;
CREATE POLICY "admins read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (app_private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "media landlord shared read" ON storage.objects;
CREATE POLICY "media landlord shared read" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'media' AND EXISTS (
      SELECT 1 FROM public.media m
      WHERE m.file_url = objects.name AND app_private.landlord_can_view_report(m.report_id)
    )
  );

-- 3) Remove the SECURITY DEFINER helpers from the exposed schema
DROP FUNCTION IF EXISTS public.report_owner(uuid);
DROP FUNCTION IF EXISTS public.landlord_can_view_report(uuid);
DROP FUNCTION IF EXISTS public.landlord_can_view_property(uuid);
DROP FUNCTION IF EXISTS public.current_email();
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Public RPC wrapper stays SECURITY INVOKER; it only reveals the caller's own admin status
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL OR _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE app_private.is_admin(auth.uid())
  END;
$$;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- 4) user_roles: allow admins to correct/revoke roles (users still cannot escalate)
DROP POLICY IF EXISTS "admins update roles" ON public.user_roles;
CREATE POLICY "admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (app_private.is_admin(auth.uid()))
  WITH CHECK (app_private.is_admin(auth.uid()));

DROP POLICY IF EXISTS "admins delete roles" ON public.user_roles;
CREATE POLICY "admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (app_private.is_admin(auth.uid()));

GRANT UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
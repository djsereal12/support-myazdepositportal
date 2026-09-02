-- 1. Pin search_path on current_email (was mutable)
CREATE OR REPLACE FUNCTION public.current_email()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  SELECT lower(coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', ''));
$function$;

-- 2. Least-privilege EXECUTE on SECURITY DEFINER / helper functions.
-- Anonymous users have no policies that need these; the signup trigger
-- function must never be callable by API roles at all.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_email() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.landlord_can_view_property(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.landlord_can_view_report(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.report_owner(uuid) FROM PUBLIC, anon;

-- Signed-in users still need these for RLS policy evaluation.
GRANT EXECUTE ON FUNCTION public.current_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.landlord_can_view_property(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.landlord_can_view_report(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_owner(uuid) TO authenticated;

-- 3. Storage: allow landlords to read ONLY media objects belonging to reports
-- they legitimately have access to (ownership join, folder check untouched).
DROP POLICY IF EXISTS "media landlord shared read" ON storage.objects;
CREATE POLICY "media landlord shared read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM public.media m
    WHERE m.file_url = storage.objects.name
      AND public.landlord_can_view_report(m.report_id)
  )
);

-- 4. Purchases are written only by the Stripe webhook via the service role.
REVOKE INSERT, UPDATE, DELETE ON public.purchases FROM anon, authenticated;
REVOKE SELECT ON public.purchases FROM anon;
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

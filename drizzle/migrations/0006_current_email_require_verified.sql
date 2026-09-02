CREATE OR REPLACE FUNCTION public.current_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only honor the email claim when the auth provider has verified it.
  SELECT lower(u.email)
  FROM auth.users u
  WHERE u.id = auth.uid()
    AND u.email_confirmed_at IS NOT NULL
    AND u.email IS NOT NULL
$function$;

REVOKE ALL ON FUNCTION public.current_email() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_email() TO authenticated, service_role;
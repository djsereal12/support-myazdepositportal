-- 1) Revoke EXECUTE on SECURITY DEFINER function not used by any RLS policy
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 2) landlord_profiles: replace broad ALL policy with explicit, field-scoped policies
DROP POLICY IF EXISTS "own landlord profile" ON public.landlord_profiles;

CREATE POLICY "own landlord profile select"
  ON public.landlord_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "own landlord profile insert"
  ON public.landlord_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own landlord profile update"
  ON public.landlord_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- prevent user_id reassignment on update
CREATE OR REPLACE FUNCTION public.lock_landlord_profile_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_landlord_profile_owner ON public.landlord_profiles;
CREATE TRIGGER lock_landlord_profile_owner
  BEFORE UPDATE ON public.landlord_profiles
  FOR EACH ROW EXECUTE FUNCTION public.lock_landlord_profile_owner();

REVOKE DELETE ON public.landlord_profiles FROM authenticated, anon;

-- 3) purchases: writes are server/webhook only. Remove any client write privileges.
REVOKE INSERT, UPDATE, DELETE ON public.purchases FROM authenticated, anon;
REVOKE ALL ON public.purchases FROM anon;
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

DROP POLICY IF EXISTS "own roles insert" ON public.user_roles;

CREATE POLICY "own roles insert non privileged"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('tenant'::public.app_role, 'landlord'::public.app_role)
);

CREATE POLICY "admins insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (app_private.is_admin(auth.uid()));

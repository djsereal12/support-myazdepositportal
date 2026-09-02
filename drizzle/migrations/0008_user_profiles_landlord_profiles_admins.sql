-- 1. Expand tenant/user profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS mailing_address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Landlord-specific profile data
CREATE TABLE IF NOT EXISTS public.landlord_profiles (
  user_id uuid PRIMARY KEY,
  company_name text,
  contact_name text,
  phone text,
  license_number text,
  mailing_address text,
  city text,
  state text,
  postal_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.landlord_profiles TO authenticated;
GRANT ALL ON public.landlord_profiles TO service_role;

ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Admin registry (separate from app_role enum, no privilege escalation via profiles)
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own admin row select" ON public.admins
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id);
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- 4. Policies
CREATE POLICY "own landlord profile" ON public.landlord_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins read landlord profiles" ON public.landlord_profiles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "admins read profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 5. Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS landlord_profiles_touch_updated_at ON public.landlord_profiles;
CREATE TRIGGER landlord_profiles_touch_updated_at
  BEFORE UPDATE ON public.landlord_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
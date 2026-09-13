CREATE TABLE public.deposit_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  rental_address TEXT NOT NULL,
  unit TEXT,
  city TEXT,
  landlord_name TEXT,
  landlord_email TEXT,
  deposit_amount NUMERIC,
  amount_withheld NUMERIC,
  move_out_date DATE,
  dispute_reason TEXT NOT NULL,
  details TEXT,
  source TEXT NOT NULL DEFAULT 'pricing',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deposit_claims TO authenticated;
GRANT ALL ON public.deposit_claims TO service_role;

ALTER TABLE public.deposit_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposit claims"
  ON public.deposit_claims FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX deposit_claims_created_at_idx ON public.deposit_claims (created_at DESC);
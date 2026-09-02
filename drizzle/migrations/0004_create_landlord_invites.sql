CREATE TABLE public.landlord_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  landlord_email text NOT NULL,
  landlord_name text,
  custom_message text,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  responded_at timestamptz,
  response_ip text,
  response_signature_name text,
  response_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX landlord_invites_report_id_idx ON public.landlord_invites (report_id);
CREATE INDEX landlord_invites_token_idx ON public.landlord_invites (token);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.landlord_invites TO authenticated;
GRANT ALL ON public.landlord_invites TO service_role;

ALTER TABLE public.landlord_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant manages own invites" ON public.landlord_invites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public.report_owner(report_id) = auth.uid());

CREATE POLICY "landlord reads invites on shared reports" ON public.landlord_invites
  FOR SELECT TO authenticated
  USING (public.landlord_can_view_report(report_id));
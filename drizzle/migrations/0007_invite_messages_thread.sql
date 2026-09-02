CREATE TABLE public.invite_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.landlord_invites(id) ON DELETE CASCADE,
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('tenant','landlord')),
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invite_messages_invite_id_idx ON public.invite_messages(invite_id);

GRANT SELECT, INSERT ON public.invite_messages TO authenticated;
GRANT ALL ON public.invite_messages TO service_role;

ALTER TABLE public.invite_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant reads thread on own reports"
ON public.invite_messages FOR SELECT TO authenticated
USING (public.report_owner(report_id) = auth.uid());

CREATE POLICY "tenant writes thread on own reports"
ON public.invite_messages FOR INSERT TO authenticated
WITH CHECK (public.report_owner(report_id) = auth.uid() AND author_role = 'tenant');

CREATE POLICY "landlord reads thread on shared reports"
ON public.invite_messages FOR SELECT TO authenticated
USING (public.landlord_can_view_report(report_id));
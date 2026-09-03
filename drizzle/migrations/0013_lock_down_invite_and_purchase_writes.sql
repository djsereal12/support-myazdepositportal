-- 1) invite_messages: append-only for clients, no anon writes.
REVOKE INSERT, UPDATE, DELETE ON public.invite_messages FROM anon;
REVOKE UPDATE, DELETE ON public.invite_messages FROM authenticated;
GRANT ALL ON public.invite_messages TO service_role;

DROP POLICY IF EXISTS "no client updates on invite messages" ON public.invite_messages;
CREATE POLICY "no client updates on invite messages"
  ON public.invite_messages
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (false);

DROP POLICY IF EXISTS "no client deletes on invite messages" ON public.invite_messages;
CREATE POLICY "no client deletes on invite messages"
  ON public.invite_messages
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated, anon
  USING (false);

-- 2) landlord_invites: clients may never write landlord response fields or the token.
REVOKE INSERT, UPDATE, DELETE ON public.landlord_invites FROM anon;
REVOKE UPDATE ON public.landlord_invites FROM authenticated;
GRANT UPDATE (landlord_email, landlord_name, custom_message, property_id)
  ON public.landlord_invites TO authenticated;
GRANT ALL ON public.landlord_invites TO service_role;

DROP POLICY IF EXISTS "invite response fields are server managed" ON public.landlord_invites;
CREATE POLICY "invite response fields are server managed"
  ON public.landlord_invites
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated, anon
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3) purchases: entitlements are written only by the Stripe webhook (service role).
REVOKE INSERT, UPDATE, DELETE ON public.purchases FROM anon, authenticated;
REVOKE SELECT ON public.purchases FROM anon;
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;

DROP POLICY IF EXISTS "no client writes on purchases" ON public.purchases;
CREATE POLICY "no client writes on purchases"
  ON public.purchases
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (auth.uid() = user_id)
  WITH CHECK (false);
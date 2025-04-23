-- Policy di esempio per la tabella user_subscriptions

-- Permetti la lettura solo all'utente autenticato sul proprio record
CREATE POLICY "Allow user to read own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Permetti la scrittura solo al service_role (backend)
CREATE POLICY "Allow service_role to insert/update"
  ON public.user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Nega tutte le altre operazioni di default
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

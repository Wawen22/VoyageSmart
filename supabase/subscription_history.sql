-- Tabella per tracciare tutti gli eventi di subscription Stripe

create table if not exists public.subscription_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null, -- es: 'created', 'updated', 'deleted', 'payment_succeeded', 'payment_failed'
  tier text,
  status text,
  stripe_subscription_id text,
  stripe_customer_id text,
  event_timestamp timestamptz not null default now(),
  details jsonb, -- dettagli aggiuntivi dell'evento
  created_at timestamptz not null default now()
);

-- Policy: solo l'utente autenticato può leggere i propri eventi
create policy "Allow user to read own history"
  on public.subscription_history
  for select
  using (user_id = auth.uid());

-- Policy: solo service_role può inserire
create policy "Allow service_role to insert"
  on public.subscription_history
  for insert
  to service_role
  using (true);

-- Policy: permetti agli utenti autenticati di inserire i propri record
create policy "Allow authenticated users to insert own history"
  on public.subscription_history
  for insert
  to authenticated
  with check (user_id = auth.uid());

alter table public.subscription_history enable row level security;

-- Smart ETA & Delay Management
-- Adds four columns to orders so admins can record restaurant-reported
-- delays without touching the original ETA (derived from created_at +
-- restaurant delivery rules in application code).
--
-- delay_reason              — admin-entered reason text (e.g. "High volume at restaurant").
-- updated_eta               — confirmed new ETA; null = no confirmed time yet.
-- delay_updated_at          — when delay info was last recorded (set by the admin action).
-- awaiting_eta_confirmation — true once a delay is logged but no confirmed ETA
--                             is available; lets the tracking page say "Awaiting
--                             confirmation" instead of showing the stale original ETA.

alter table public.orders
  add column if not exists delay_reason text,
  add column if not exists updated_eta timestamptz,
  add column if not exists delay_updated_at timestamptz,
  add column if not exists awaiting_eta_confirmation boolean not null default false;

-- Fast lookup for active delayed orders
create index if not exists idx_orders_delay_updated_at
  on public.orders (delay_updated_at)
  where delay_updated_at is not null;

-- Historical audit trail of delay reports and ETA adjustments (Section 10)
create table if not exists public.order_delay_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  previous_eta timestamptz,
  new_eta timestamptz,
  delay_reason text not null,
  awaiting_eta_confirmation boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_order_delay_history_order_id
  on public.order_delay_history(order_id);

alter table public.order_delay_history enable row level security;

-- Admin can read and insert history
create policy "Admins have full access to order delay history"
  on public.order_delay_history
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Students can read delay history for their own orders
create policy "Students can view delay history for their own orders"
  on public.order_delay_history
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_delay_history.order_id
        and orders.user_id = auth.uid()
    )
  );

-- Devices that have turned order notifications on (web push). One row per
-- browser/device; the endpoint is the browser's own address for it.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- A student manages only their own devices, and can't read anyone else's.
create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- An admin reads every row: that's how a status change reaches the
-- student's phone (same pattern as the admin read policies on orders).
create policy "admins read push subscriptions" on public.push_subscriptions
  for select to authenticated
  using (public.is_admin());

-- Sending also drops devices the push service reports as gone (404/410).
create policy "admins delete stale push subscriptions" on public.push_subscriptions
  for delete to authenticated
  using (public.is_admin());

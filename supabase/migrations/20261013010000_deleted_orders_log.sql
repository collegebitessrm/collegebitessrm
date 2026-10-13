-- Log deleted orders per restaurant so stats can count them after the
-- order row is gone. The admin delete action inserts a row here before
-- deleting the order; the stats query reads this log alongside the
-- live orders table.
-- Stores enough to subtract their revenue and item counts from analytics.
create table public.deleted_orders_log (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  status text not null,
  total_amount numeric not null default 0,
  items_summary jsonb not null default '{"fulls":0,"singles":0,"starters":0}',
  deleted_at timestamptz not null default now()
);

alter table public.deleted_orders_log enable row level security;

-- Admins can insert (when deleting orders) and read (for stats).
create policy "Admins can manage deleted orders log" on public.deleted_orders_log
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

</
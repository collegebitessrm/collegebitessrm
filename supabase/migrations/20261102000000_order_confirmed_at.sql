-- Add confirmed_at column to orders table so delivery countdown starts
-- from when the restaurant / admin confirms the order, not when placed.
alter table public.orders
  add column if not exists confirmed_at timestamptz;

-- Fast index for confirmed orders lookup
create index if not exists idx_orders_confirmed_at
  on public.orders (confirmed_at)
  where confirmed_at is not null;

-- Automatically set confirmed_at when an order transitions out of 'pending'
create or replace function public.set_confirmed_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('confirmed', 'preparing', 'out_for_delivery', 'at_gate', 'delivered')
     and (old.status = 'pending' or old.status is null)
     and new.confirmed_at is null then
    new.confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists set_confirmed_at on public.orders;
create trigger set_confirmed_at before update of status on public.orders
  for each row execute function public.set_confirmed_at();

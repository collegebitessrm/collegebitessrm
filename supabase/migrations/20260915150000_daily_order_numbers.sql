-- Sequential per-day order numbers ("Order #1", "#2", ... at VIT-AP Main
-- Gate), resetting every day at midnight IST — shown to both the student
-- (their pickup token) and the admin (order list), so they must always
-- match exactly. Assigned once at insert time via an atomic counter
-- table + trigger, not derived by counting/ranking on read, so two
-- orders placed the same second can never collide or drift.

create table public.daily_order_counters (
  order_day date primary key,
  last_number int not null default 0
);

alter table public.orders add column daily_number int;

create or replace function public.set_daily_order_number()
returns trigger
language plpgsql
as $$
declare
  today date := (new.created_at at time zone 'Asia/Kolkata')::date;
begin
  insert into public.daily_order_counters (order_day, last_number)
  values (today, 1)
  on conflict (order_day)
  do update set last_number = daily_order_counters.last_number + 1
  returning last_number into new.daily_number;
  return new;
end;
$$;

create trigger set_daily_order_number
  before insert on public.orders
  for each row execute function public.set_daily_order_number();

-- Backfill existing orders (chronological per IST day) and seed the
-- counter table so future inserts continue from the right number.
with numbered as (
  select id, row_number() over (
    partition by (created_at at time zone 'Asia/Kolkata')::date
    order by created_at
  ) as rn
  from public.orders
)
update public.orders o
set daily_number = numbered.rn
from numbered
where o.id = numbered.id;

insert into public.daily_order_counters (order_day, last_number)
select (created_at at time zone 'Asia/Kolkata')::date, max(daily_number)
from public.orders
where daily_number is not null
group by (created_at at time zone 'Asia/Kolkata')::date
on conflict (order_day) do update set last_number = excluded.last_number;

alter table public.orders alter column daily_number set not null;

-- No RLS policies needed on daily_order_counters (the app never reads or
-- writes it directly, only the trigger does, running under place_order()'s
-- security-definer context) or for orders.daily_number (it's just a new
-- column on an already-RLS'd table, covered by the existing policies).
alter table public.daily_order_counters enable row level security;

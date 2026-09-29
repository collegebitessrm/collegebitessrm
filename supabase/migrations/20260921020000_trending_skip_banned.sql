-- Trending ignores test orders: anything placed before launch (1 Oct 2026,
-- IST) and any order from a banned phone number (the test accounts were
-- banned after launch, and anyone banned later drops out too). Same
-- function otherwise; grants from 20260916000000 are unchanged.
create or replace function public.trending_dishes(days_back int default 7, result_limit int default 5)
returns table (
  dish_id uuid,
  dish_name text,
  restaurant_id uuid,
  restaurant_name text,
  order_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select d.id, d.name, r.id, r.name, count(*) as order_count
  from order_items oi
  join orders o on o.id = oi.order_id
  join users ou on ou.id = o.user_id
  join dishes d on d.id = oi.dish_id
  join restaurants r on r.id = d.restaurant_id
  where o.created_at >= now() - (days_back || ' days')::interval
    and o.created_at >= '2026-10-01 00:00+05:30'
    and o.status <> 'cancelled'
    and d.is_available
    and r.is_active
    and not exists (
      select 1 from users b
      where b.phone = ou.phone and b.is_banned
    )
  group by d.id, d.name, r.id, r.name
  order by order_count desc
  limit result_limit;
$$;

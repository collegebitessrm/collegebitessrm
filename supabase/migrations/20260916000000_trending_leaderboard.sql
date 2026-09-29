-- "Trending this week" leaderboard on the home screen: top ordered dishes
-- and top restaurants campus-wide over a rolling window. Students can only
-- read their own orders/order_items via RLS, so a cross-student aggregate
-- needs a security-definer function — same pattern as place_order() and
-- current_user_is_banned(). Both functions only ever return aggregate
-- counts (dish/restaurant names + a count), never anything per-student, so
-- they don't leak who ordered what.

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
  join dishes d on d.id = oi.dish_id
  join restaurants r on r.id = d.restaurant_id
  where o.created_at >= now() - (days_back || ' days')::interval
    and o.status <> 'cancelled'
    and d.is_available
    and r.is_active
  group by d.id, d.name, r.id, r.name
  order by order_count desc
  limit result_limit;
$$;

create or replace function public.trending_restaurants(days_back int default 7, result_limit int default 3)
returns table (
  restaurant_id uuid,
  restaurant_name text,
  order_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.name, count(*) as order_count
  from orders o
  join restaurants r on r.id = o.restaurant_id
  where o.created_at >= now() - (days_back || ' days')::interval
    and o.status <> 'cancelled'
    and r.is_active
  group by r.id, r.name
  order by order_count desc
  limit result_limit;
$$;

revoke execute on function public.trending_dishes(int, int) from public, anon;
grant execute on function public.trending_dishes(int, int) to authenticated;

revoke execute on function public.trending_restaurants(int, int) from public, anon;
grant execute on function public.trending_restaurants(int, int) to authenticated;

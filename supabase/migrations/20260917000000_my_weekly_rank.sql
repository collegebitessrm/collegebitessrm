-- The calling student's own rank among everyone who ordered in the last
-- N days — security definer since RLS only lets a student read their own
-- orders, so there's no other way to compute a percentile. Returns only
-- the caller's row (scoped by auth.uid()), never other students' counts
-- or identities — same privacy shape as current_user_is_banned().

create or replace function public.my_weekly_rank(days_back int default 7)
returns table (
  my_order_count int,
  total_students int,
  rank int,
  percentile int   -- "top N%" — 1 means top 1%, 100 means everyone (last place)
)
language sql
security definer
set search_path = public
stable
as $$
  with counts as (
    select user_id, count(*) as order_count
    from orders
    where created_at >= now() - (days_back || ' days')::interval
      and status <> 'cancelled'
    group by user_id
  ),
  ranked as (
    select
      user_id,
      order_count,
      rank() over (order by order_count desc) as rnk,
      count(*) over () as total
    from counts
  )
  select order_count, total, rnk, ceil(100.0 * rnk / total)::int
  from ranked
  where user_id = auth.uid();
$$;

revoke execute on function public.my_weekly_rank(int) from public, anon;
grant execute on function public.my_weekly_rank(int) to authenticated;

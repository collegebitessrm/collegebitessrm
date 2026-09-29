-- "Highly re-ordered" dish tag: a dish counts as highly re-ordered when at
-- least `min_repeat_students` distinct students have each ordered it 3+
-- times (not counting cancelled orders) — a genuine repeat-purchase
-- signal, distinct from trending_dishes()'s raw order-volume popularity.
-- Security definer, same reasoning as trending_dishes()/my_weekly_rank():
-- students can only read their own orders/order_items under RLS, so this
-- is the only way to compute a cross-student aggregate. Returns only
-- aggregate counts (dish/restaurant name + a number), never which
-- students or their individual order history.

create or replace function public.highly_reordered_dishes(min_repeat_students int default 3, result_limit int default 10)
returns table (
  dish_id uuid,
  dish_name text,
  restaurant_id uuid,
  restaurant_name text,
  repeat_student_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with per_student_dish_counts as (
    select o.user_id, oi.dish_id, count(*) as order_count
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.status <> 'cancelled'
      and oi.dish_id is not null
    group by o.user_id, oi.dish_id
  ),
  repeaters as (
    select dish_id, count(*) as repeat_student_count
    from per_student_dish_counts
    where order_count >= 3
    group by dish_id
  )
  select d.id, d.name, r.id, r.name, rep.repeat_student_count
  from repeaters rep
  join dishes d on d.id = rep.dish_id
  join restaurants r on r.id = d.restaurant_id
  where rep.repeat_student_count >= min_repeat_students
    and d.is_available
    and r.is_active
  order by rep.repeat_student_count desc
  limit result_limit;
$$;

revoke execute on function public.highly_reordered_dishes(int, int) from public, anon;
grant execute on function public.highly_reordered_dishes(int, int) to authenticated;

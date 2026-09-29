-- College Bites has no daily ordering schedule: the admin opens or closes
-- ordering whenever they like. app_settings.ordering_mode is just
-- 'open' | 'closed' (replacing MuteBites' ordering_enabled boolean and its
-- 'auto' schedule mode), and ordering_is_open() stays the single source of
-- truth that place_order() and the app both read.
--
-- Also: each restaurant has its own delivery time in minutes from when the
-- order is placed (40 by default; Biryani Nation is 60).
--
-- place_order() below is MuteBites' final version (rate limits from
-- 20260922000000) with the ordering check simplified to Open / Closed.

-- 1. Open / Closed switch set by the admin, no daily schedule.
alter table public.app_settings
  add column ordering_mode text not null default 'open'
    check (ordering_mode in ('open', 'closed'));

update public.app_settings
   set ordering_mode = case when ordering_enabled then 'open' else 'closed' end;

-- 2. Single source of truth.
create or replace function public.ordering_is_open()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select ordering_mode = 'open' from app_settings;
$$;

revoke execute on function public.ordering_is_open() from public;
grant execute on function public.ordering_is_open() to anon, authenticated;

-- 3. Delivery time per restaurant (minutes from placing the order).
alter table public.restaurants
  add column delivery_minutes int not null default 40
    check (delivery_minutes between 5 and 240);

-- 4. place_order(): final form. Closed -> 'ordering_paused'.
create or replace function public.place_order(
  p_restaurant_id uuid,
  p_items jsonb,
  p_contact_phone text,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_item_count int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  if not exists (select 1 from users where id = v_user_id) then
    raise exception 'profile_missing';
  end if;
  if not public.ordering_is_open() then
    raise exception 'ordering_paused';
  end if;
  if current_user_is_banned() then
    raise exception 'banned';
  end if;

  -- Rate limit. The per-student lock (released when this transaction
  -- ends) makes two taps at the same instant count one after the other,
  -- so both can't slip under the limit together.
  perform pg_advisory_xact_lock(hashtext('place_order:' || v_user_id::text));
  if (select count(*) from orders
       where user_id = v_user_id
         and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'order_rate_limited';
  end if;
  if (select count(*) from orders
       where user_id = v_user_id
         and status not in ('delivered', 'cancelled')) >= 8 then
    raise exception 'too_many_open_orders';
  end if;

  if p_contact_phone is null or p_contact_phone !~ '^\+91[6-9][0-9]{9}$' then
    raise exception 'invalid_contact_phone';
  end if;
  if p_notes is not null and length(p_notes) > 200 then
    raise exception 'notes_too_long';
  end if;
  if not exists (select 1 from restaurants where id = p_restaurant_id and is_active) then
    raise exception 'restaurant_closed';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  create temporary table _items on commit drop as
    select (e->>'dish_id')::uuid as dish_id, (e->>'quantity')::int as quantity
    from jsonb_array_elements(p_items) e;

  select count(*) into v_item_count from _items;

  if exists (select 1 from _items where dish_id is null or quantity is null or quantity not between 1 and 20)
     or (select count(distinct dish_id) from _items) <> v_item_count then
    raise exception 'invalid_items';
  end if;

  if (select count(*) from _items i
        join dishes d on d.id = i.dish_id
       where d.restaurant_id = p_restaurant_id and d.is_available) <> v_item_count then
    raise exception 'dish_unavailable';
  end if;

  insert into orders (user_id, restaurant_id, contact_phone, notes, total_amount)
  values (v_user_id, p_restaurant_id, p_contact_phone, nullif(trim(p_notes), ''), 0)
  returning id into v_order_id;

  insert into order_items (order_id, dish_id, dish_name, unit_price, quantity)
  select v_order_id, d.id, d.name, d.price, i.quantity
  from _items i join dishes d on d.id = i.dish_id;

  update orders
     set total_amount = (select sum(subtotal) from order_items where order_id = v_order_id)
   where id = v_order_id;

  return v_order_id;
end;
$$;

-- 5. The old boolean switch, now replaced.
alter table public.app_settings drop column ordering_enabled;

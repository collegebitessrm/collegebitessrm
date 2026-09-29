-- Orders are created only through place_order(): one transaction for the
-- order and its items, with names/prices snapshotted from dishes (never
-- from the client), total computed server-side, status left at its
-- 'pending' default, and every rule (auth, profile, ban by phone,
-- restaurant open, dishes available) checked in the database.
--
-- Errors are raised with short keys (e.g. 'restaurant_closed') that the
-- app maps to friendly messages.

create or replace function public.place_order(
  p_restaurant_id uuid,
  p_items jsonb,               -- [{"dish_id": "<uuid>", "quantity": 2}, ...]
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
  if current_user_is_banned() then
    raise exception 'banned';
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

  -- Every dish must belong to this restaurant and be available right now.
  if (select count(*) from _items i
        join dishes d on d.id = i.dish_id
       where d.restaurant_id = p_restaurant_id and d.is_available) <> v_item_count then
    raise exception 'dish_unavailable';
  end if;

  insert into orders (user_id, restaurant_id, contact_phone, notes, total_amount)
  values (v_user_id, p_restaurant_id, p_contact_phone, nullif(trim(p_notes), ''), 0)
  returning id into v_order_id;

  -- Name and price are snapshotted from dishes, never from the client.
  insert into order_items (order_id, dish_id, dish_name, unit_price, quantity)
  select v_order_id, d.id, d.name, d.price, i.quantity
  from _items i join dishes d on d.id = i.dish_id;

  update orders
     set total_amount = (select sum(subtotal) from order_items where order_id = v_order_id)
   where id = v_order_id;

  return v_order_id;
end;
$$;

revoke execute on function public.place_order(uuid, jsonb, text, text) from public, anon;
grant execute on function public.place_order(uuid, jsonb, text, text) to authenticated;

-- place_order() is now the only way to create orders: no direct inserts,
-- so status/total/unit_price can't be set by the client.
drop policy "Users can create own orders" on public.orders;
drop policy "Users can create own order items" on public.order_items;

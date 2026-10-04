-- Discount offers (10% / 20% / free Single biryani) apply only to orders
-- from Clg Bites Biryani Nation (by decision, 4 Oct 2026). Same function as
-- 20261001050000_discount_offers.sql with one new check: an offer on any
-- other restaurant's order raises 'offer_wrong_restaurant'. Same signature,
-- so the existing grants (authenticated only) stay as they are.

create or replace function public.place_order(
  p_restaurant_id uuid,
  p_items jsonb,
  p_contact_phone text,
  p_notes text default null,
  p_offer text default null,
  p_free_items jsonb default null
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
  v_settings app_settings;
  v_items_total numeric;
  v_discount numeric := 0;
  v_full_count int;
  v_free_count int;
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

  -- Offers ------------------------------------------------------------
  create temporary table _free (dish_id uuid, quantity int) on commit drop;

  if p_offer is not null then
    select * into v_settings from app_settings;
    if p_offer not in ('pct10', 'pct20', 'biryani')
       or (p_offer = 'pct10' and not v_settings.offer_pct10)
       or (p_offer = 'pct20' and not v_settings.offer_pct20)
       or (p_offer = 'biryani' and not v_settings.offer_biryani) then
      raise exception 'offer_unavailable';
    end if;

    -- Every offer is for Clg Bites Biryani Nation orders only.
    if p_restaurant_id <> '4c887e24-4d51-47f3-b8f8-4c97bba87567'::uuid then
      raise exception 'offer_wrong_restaurant';
    end if;

    if p_offer = 'biryani' then
      if jsonb_typeof(p_free_items) is distinct from 'array' or jsonb_array_length(p_free_items) = 0 then
        raise exception 'offer_not_eligible';
      end if;
      insert into _free
        select (e->>'dish_id')::uuid, (e->>'quantity')::int
        from jsonb_array_elements(p_free_items) e;

      if exists (select 1 from _free where dish_id is null or quantity is null or quantity < 1)
         or (select count(distinct dish_id) from _free) <> (select count(*) from _free) then
        raise exception 'invalid_items';
      end if;
      -- Every free pick is an available Single biryani from this restaurant.
      if (select count(*) from _free f
            join dishes d on d.id = f.dish_id
           where d.restaurant_id = p_restaurant_id and d.is_available
             and d.name like '% Biryani (Single)') <> (select count(*) from _free) then
        raise exception 'offer_not_eligible';
      end if;
      -- One free Single per 3 paid Full biryanis.
      select coalesce(sum(i.quantity), 0) into v_full_count
        from _items i join dishes d on d.id = i.dish_id
       where d.name like '% Biryani (Full)';
      select sum(quantity) into v_free_count from _free;
      if v_free_count > v_full_count / 3 then
        raise exception 'offer_not_eligible';
      end if;
    elsif p_free_items is not null and jsonb_typeof(p_free_items) = 'array'
          and jsonb_array_length(p_free_items) > 0 then
      raise exception 'invalid_items';
    end if;
  elsif p_free_items is not null and jsonb_typeof(p_free_items) = 'array'
        and jsonb_array_length(p_free_items) > 0 then
    raise exception 'invalid_items';
  end if;

  -- Write -------------------------------------------------------------
  insert into orders (user_id, restaurant_id, contact_phone, notes, total_amount, discount_offer)
  values (v_user_id, p_restaurant_id, p_contact_phone, nullif(trim(p_notes), ''), 0, p_offer)
  returning id into v_order_id;

  insert into order_items (order_id, dish_id, dish_name, unit_price, quantity)
  select v_order_id, d.id, d.name, d.price, i.quantity
  from _items i join dishes d on d.id = i.dish_id;

  insert into order_items (order_id, dish_id, dish_name, unit_price, quantity, is_free)
  select v_order_id, d.id, d.name, d.price, f.quantity, true
  from _free f join dishes d on d.id = f.dish_id;

  select coalesce(sum(subtotal) filter (where not is_free), 0) into v_items_total
    from order_items where order_id = v_order_id;

  v_discount := case p_offer
    when 'pct10' then round(v_items_total * 0.10)
    when 'pct20' then round(v_items_total * 0.20)
    when 'biryani' then (select coalesce(sum(subtotal), 0) from order_items
                          where order_id = v_order_id and is_free)
    else 0
  end;

  update orders
     set discount_amount = v_discount,
         total_amount = (select sum(subtotal) from order_items where order_id = v_order_id) - v_discount
   where id = v_order_id;

  return v_order_id;
end;
$$;

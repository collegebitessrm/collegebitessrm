-- Dish ratings: after an order is delivered, the student rates every dish
-- in it 1–5 stars and can leave one optional note (<= 300 chars). One
-- review per order, submit once, within 7 days of delivery. Reviews are
-- visible to the student who wrote them and to admins only — never to
-- other students. No photos (decided against: storage + cleanup cost).

-- 1. When an order was delivered — the 7-day review window counts from it.
alter table public.orders add column delivered_at timestamptz;

create or replace function public.set_delivered_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    new.delivered_at := now();
  end if;
  return new;
end;
$$;

create trigger set_delivered_at before update of status on public.orders
  for each row execute function public.set_delivered_at();

-- 2. One review per order (the optional note lives here).
create table public.order_reviews (
  order_id uuid primary key references public.orders (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  note text check (note is null or length(note) <= 300),
  created_at timestamptz not null default now()
);

-- 3. Stars for each dish in the order. dish_id is kept (set null if the
--    dish is ever deleted) so per-dish averages survive menu edits.
create table public.order_item_ratings (
  order_item_id uuid primary key references public.order_items (id) on delete cascade,
  order_id uuid not null references public.order_reviews (order_id) on delete cascade,
  dish_id uuid references public.dishes (id) on delete set null,
  rating smallint not null check (rating between 1 and 5)
);

create index order_item_ratings_order_id_idx on public.order_item_ratings (order_id);
create index order_item_ratings_dish_id_idx on public.order_item_ratings (dish_id);

-- 4. RLS: a student reads only their own review; admins read everything.
--    No insert/update/delete policies at all — submit_review() below is
--    the only way in, and reviews can't be edited or removed via the API.
alter table public.order_reviews enable row level security;
alter table public.order_item_ratings enable row level security;

create policy "Students read their own reviews; admins read all" on public.order_reviews
  for select using (user_id = auth.uid() or public.is_admin());

create policy "Students read their own ratings; admins read all" on public.order_item_ratings
  for select using (
    exists (
      select 1 from public.order_reviews r
       where r.order_id = order_item_ratings.order_id
         and (r.user_id = auth.uid() or public.is_admin())
    )
  );

-- 5. submit_review(): the only write path. p_ratings is a JSON array of
--    { "order_item_id": uuid, "rating": 1..5 } — exactly one per dish in
--    the order. Raises short error keys the app maps to messages.
create or replace function public.submit_review(
  p_order_id uuid,
  p_ratings jsonb,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order orders%rowtype;
  v_item_count int;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_order from orders where id = p_order_id and user_id = v_user_id;
  if not found then
    raise exception 'order_not_found';
  end if;
  if v_order.status <> 'delivered' then
    raise exception 'not_delivered';
  end if;
  if v_order.delivered_at is null or v_order.delivered_at < now() - interval '7 days' then
    raise exception 'review_window_closed';
  end if;
  if exists (select 1 from order_reviews where order_id = p_order_id) then
    raise exception 'already_reviewed';
  end if;
  if p_note is not null and length(p_note) > 300 then
    raise exception 'note_too_long';
  end if;
  if jsonb_typeof(p_ratings) is distinct from 'array' then
    raise exception 'invalid_ratings';
  end if;

  create temporary table _ratings on commit drop as
    select (e->>'order_item_id')::uuid as order_item_id, (e->>'rating')::int as rating
    from jsonb_array_elements(p_ratings) e;

  select count(*) into v_item_count from order_items where order_id = p_order_id;

  -- Every dish in the order rated exactly once, 1–5, and nothing else.
  if (select count(*) from _ratings) <> v_item_count
     or (select count(distinct order_item_id) from _ratings) <> v_item_count
     or exists (select 1 from _ratings where rating is null or rating not between 1 and 5)
     or (select count(*) from _ratings r
           join order_items oi on oi.id = r.order_item_id
          where oi.order_id = p_order_id) <> v_item_count then
    raise exception 'invalid_ratings';
  end if;

  insert into order_reviews (order_id, user_id, note)
  values (p_order_id, v_user_id, nullif(trim(p_note), ''));

  insert into order_item_ratings (order_item_id, order_id, dish_id, rating)
  select r.order_item_id, p_order_id, oi.dish_id, r.rating
    from _ratings r
    join order_items oi on oi.id = r.order_item_id;
end;
$$;

revoke execute on function public.submit_review(uuid, jsonb, text) from public, anon;
grant execute on function public.submit_review(uuid, jsonb, text) to authenticated;

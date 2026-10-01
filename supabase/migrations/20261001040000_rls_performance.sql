-- Supabase performance advisor (1 Oct 2026). Same rules, cheaper to run:
-- auth.uid() / is_admin() wrapped in (select …) so they're evaluated once
-- per query, not once per row; an admin rule and an own-row rule for the
-- same action merged into one (their exact OR); policies scoped to
-- `authenticated` (signed-out visitors never matched them); and indexes on
-- four foreign keys. Who can read or write what does not change.

-- users
drop policy "Users can view own profile" on public.users;
drop policy "Admins can view all users" on public.users;
create policy "Users read own profile; admins read all" on public.users
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy "Users can update own profile" on public.users;
drop policy "Admins can update any user" on public.users;
create policy "Users update own profile; admins update any" on public.users
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

drop policy "Users can insert own profile" on public.users;
create policy "Users can insert own profile" on public.users
  for insert to authenticated
  with check (id = (select auth.uid()));

-- orders
drop policy "Users can view own orders" on public.orders;
drop policy "Admins can view all orders" on public.orders;
create policy "Users read own orders; admins read all" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy "Admins can update any order" on public.orders;
create policy "Admins can update any order" on public.orders
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- order_items
drop policy "Users can view own order items" on public.order_items;
drop policy "Admins can view all order items" on public.order_items;
create policy "Users read own order items; admins read all" on public.order_items
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.orders o
               where o.id = order_items.order_id and o.user_id = (select auth.uid()))
  );

-- order_reviews / order_item_ratings
drop policy "Students read their own reviews; admins read all" on public.order_reviews;
create policy "Students read their own reviews; admins read all" on public.order_reviews
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy "Students read their own ratings; admins read all" on public.order_item_ratings;
create policy "Students read their own ratings; admins read all" on public.order_item_ratings
  for select to authenticated
  using (exists (select 1 from public.order_reviews r
                 where r.order_id = order_item_ratings.order_id
                   and (r.user_id = (select auth.uid()) or (select public.is_admin()))));

-- push_subscriptions (own rows; admins also read and delete stale ones)
drop policy "own push subscriptions" on public.push_subscriptions;
drop policy "admins read push subscriptions" on public.push_subscriptions;
drop policy "admins delete stale push subscriptions" on public.push_subscriptions;
create policy "Read own push subscriptions; admins read all" on public.push_subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Delete own push subscriptions; admins delete stale" on public.push_subscriptions
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Add own push subscriptions" on public.push_subscriptions
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Update own push subscriptions" on public.push_subscriptions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- milestone_rewards
drop policy "Students read own milestone reward" on public.milestone_rewards;
drop policy "Admins read all milestone rewards" on public.milestone_rewards;
create policy "Students read own milestone reward; admins read all" on public.milestone_rewards
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy "Admins mark milestone rewards claimed" on public.milestone_rewards;
create policy "Admins mark milestone rewards claimed" on public.milestone_rewards
  for insert to authenticated
  with check ((select public.is_admin()) and marked_by = (select auth.uid()));
drop policy "Admins undo milestone rewards" on public.milestone_rewards;
create policy "Admins undo milestone rewards" on public.milestone_rewards
  for delete to authenticated
  using ((select public.is_admin()));

-- taste_profiles
drop policy "Students read own taste profile" on public.taste_profiles;
drop policy "Students create own taste profile" on public.taste_profiles;
drop policy "Students update own taste profile" on public.taste_profiles;
create policy "Students read own taste profile" on public.taste_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Students create own taste profile" on public.taste_profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Students update own taste profile" on public.taste_profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- favorite_dishes
drop policy "Students read own favourite dishes" on public.favorite_dishes;
drop policy "Students add own favourite dishes" on public.favorite_dishes;
drop policy "Students remove own favourite dishes" on public.favorite_dishes;
create policy "Students read own favourite dishes" on public.favorite_dishes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Students add own favourite dishes" on public.favorite_dishes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Students remove own favourite dishes" on public.favorite_dishes
  for delete to authenticated using (user_id = (select auth.uid()));

-- Indexes on foreign keys the advisor flagged
create index if not exists dishes_category_id_idx on public.dishes (category_id);
create index if not exists milestone_rewards_marked_by_idx on public.milestone_rewards (marked_by);
create index if not exists order_items_dish_id_idx on public.order_items (dish_id);
create index if not exists order_reviews_user_id_idx on public.order_reviews (user_id);

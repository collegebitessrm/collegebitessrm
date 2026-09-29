-- Add a role to users and use it to gate admin-only writes.
-- No separate admin login system: an admin is just a users row with
-- role = 'admin', flipped manually in the database after sign-up.

create type public.user_role as enum ('student', 'admin');

alter table public.users
  add column role public.user_role not null default 'student';

-- Helper to check the caller's role without repeating the subquery in
-- every policy. security definer so the check itself isn't blocked by
-- users' own RLS policy.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

-- Orders: admins can update any order (status changes, etc). Existing
-- "Users can view/create own orders" policies are untouched.
create policy "Admins can update any order" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- Restaurants / dish_categories / dishes: admins get full write access
-- (insert/update/delete) - covers toggling is_active / is_available, and
-- general menu management, not just availability flags.
create policy "Admins can insert restaurants" on public.restaurants
  for insert with check (public.is_admin());
create policy "Admins can update restaurants" on public.restaurants
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete restaurants" on public.restaurants
  for delete using (public.is_admin());

create policy "Admins can insert dish categories" on public.dish_categories
  for insert with check (public.is_admin());
create policy "Admins can update dish categories" on public.dish_categories
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete dish categories" on public.dish_categories
  for delete using (public.is_admin());

create policy "Admins can insert dishes" on public.dishes
  for insert with check (public.is_admin());
create policy "Admins can update dishes" on public.dishes
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete dishes" on public.dishes
  for delete using (public.is_admin());

-- Block role changes made through the API (PostgREST sets auth.role() to
-- 'authenticated'/'anon'); direct DB access (SQL editor, migrations) has
-- no such claim, so the manual "flip my row to admin" workflow still works.
-- Without this, the existing "Users can update own profile" policy would
-- let a student self-promote to admin via a normal update call.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() = 'authenticated' then
    raise exception 'role cannot be changed via the API';
  end if;
  return new;
end;
$$;

create trigger prevent_role_self_escalation
  before update on public.users
  for each row execute function public.prevent_role_self_escalation();

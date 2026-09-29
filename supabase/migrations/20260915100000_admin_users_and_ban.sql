-- Admin dashboard, part 2 (orders view + ban action): admins need to read
-- other students' profiles and every order's items, and need a way to
-- flip is_banned through the app instead of only by hand in the DB.

-- Admins can see student profiles (name) — needed to show who placed
-- each order. Read-only; doesn't expose anything students can't already
-- see about their own row.
create policy "Admins can view all users" on public.users
  for select using (public.is_admin());

-- Admins can see items on every order, not just their own — there was no
-- order_items policy for admins at all yet.
create policy "Admins can view all order items" on public.order_items
  for select using (public.is_admin());

-- Admins can update another student's row — needed for the ban toggle.
create policy "Admins can update any user" on public.users
  for update using (public.is_admin()) with check (public.is_admin());

-- prevent_role_self_escalation previously blocked *any* API change to
-- is_banned, admin included, since it only checked auth.role() =
-- 'authenticated'. Split it: `role` stays fully API-blocked (still only
-- changeable by hand in the DB, unchanged) but `is_banned` is now allowed
-- through the API specifically when the caller is an admin — that's what
-- lets the ban button work, while a student still can't self-unban.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() = 'authenticated' then
    raise exception 'role cannot be changed via the API';
  end if;

  if new.is_banned is distinct from old.is_banned
     and auth.role() = 'authenticated' and not public.is_admin() then
    raise exception 'is_banned cannot be changed via the API';
  end if;

  if new.phone is distinct from old.phone and auth.role() = 'authenticated' then
    if old.is_banned then
      raise exception 'phone cannot be changed while banned';
    end if;
    if exists (
      select 1 from public.orders
      where orders.user_id = old.id
        and orders.status in ('pending', 'confirmed', 'preparing', 'out_for_delivery')
    ) then
      raise exception 'phone cannot be changed while an order is in progress';
    end if;
  end if;

  return new;
end;
$$;

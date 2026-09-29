-- Support for switching from OTP to "Continue with Google" auth: one
-- account per phone number, phone required (collected on first login
-- alongside full_name, so it's expected to always be set by the time a
-- users row exists), and a manual ban flag so admins can block repeat
-- no-shows from ordering. email is already `not null unique` from the
-- initial schema — no change needed there.

alter table public.users
  alter column phone set not null;

alter table public.users
  add constraint users_phone_key unique (phone);

alter table public.users
  add column is_banned boolean not null default false;

-- Mirrors public.is_admin() so RLS policies can check ban status without
-- repeating the subquery.
create or replace function public.current_user_is_banned()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_banned from public.users where id = auth.uid()),
    false
  );
$$;

-- Banned students can no longer place new orders. Read access and
-- existing orders are untouched.
drop policy "Users can create own orders" on public.orders;
create policy "Users can create own orders" on public.orders
  for insert with check (
    auth.uid() = user_id and not public.current_user_is_banned()
  );

-- The existing "Users can update own profile" policy (from the initial
-- schema) only checks `auth.uid() = id`, with no column restriction —
-- meaning a banned student could otherwise just set is_banned back to
-- false on themselves, the same self-escalation hole role had. Widen the
-- existing trigger (defined in 20260915010000, redefined here in place
-- rather than editing that already-applied migration) to guard is_banned
-- too.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
as $$
begin
  if (new.role is distinct from old.role or new.is_banned is distinct from old.is_banned)
     and auth.role() = 'authenticated' then
    raise exception 'role and is_banned cannot be changed via the API';
  end if;
  return new;
end;
$$;

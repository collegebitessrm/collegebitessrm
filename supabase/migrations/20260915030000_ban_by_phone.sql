-- Drop phone uniqueness: multiple Google accounts can now share a phone
-- number. Ban enforcement moves from "is this account banned" to "is
-- ANY account with this phone number banned" - closes the loophole where
-- a banned student just signs up again with a new Google login but the
-- same phone number.

alter table public.users
  drop constraint users_phone_key;

-- Despite the name (kept as-is so the already-applied orders insert
-- policy referencing it needs no change), this no longer checks only the
-- calling account's own is_banned flag - it checks every users row that
-- shares the calling account's phone number.
create or replace function public.current_user_is_banned()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users banned_by_phone
    where banned_by_phone.phone = (
      select phone from public.users where id = auth.uid()
    )
    and banned_by_phone.is_banned = true
  );
$$;

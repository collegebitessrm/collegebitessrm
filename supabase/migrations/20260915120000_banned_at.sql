-- Tracks when a student's ban started, so the admin dashboard's "Banned
-- Users" list can show a date without guessing. Kept correct no matter how
-- is_banned changes — through the app's ban toggle or by hand in the SQL
-- editor — rather than relying on every call site to set it explicitly.

alter table public.users add column banned_at timestamptz;

create or replace function public.set_banned_at()
returns trigger
language plpgsql
as $$
begin
  if new.is_banned and not old.is_banned then
    new.banned_at := now();
  elsif not new.is_banned and old.is_banned then
    new.banned_at := null;
  end if;
  return new;
end;
$$;

create trigger set_banned_at
  before update on public.users
  for each row
  execute function public.set_banned_at();

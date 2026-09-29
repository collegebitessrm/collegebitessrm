-- Supabase security advisor clean-up: pin search_path on the trigger
-- functions, and keep signed-out visitors away from the ban check.
-- (The revoke here didn't take on its own — see 20260929020000.)

alter function public.set_updated_at() set search_path = public;
alter function public.prevent_role_self_escalation() set search_path = public;
alter function public.set_banned_at() set search_path = public;
alter function public.set_daily_order_number() set search_path = public;
revoke execute on function public.current_user_is_banned() from anon;

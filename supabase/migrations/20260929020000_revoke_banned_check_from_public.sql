-- current_user_is_banned() was still callable signed-out: its access came
-- through Postgres's default PUBLIC grant, not a direct grant to anon.
revoke execute on function public.current_user_is_banned() from public, anon;
grant execute on function public.current_user_is_banned() to authenticated;

-- Lets the order tracking page get live status updates via Supabase
-- Realtime, instead of only ever showing what the page had at load time.
-- Publishing a table only lets already-RLS-authorized clients receive its
-- row changes — a student's existing "Users can view own orders" policy
-- (auth.uid() = user_id) already governs who can read a given order, so
-- this doesn't loosen access, it just lets that same authorized read
-- stream live instead of needing a manual refresh to see it.

alter publication supabase_realtime add table public.orders;

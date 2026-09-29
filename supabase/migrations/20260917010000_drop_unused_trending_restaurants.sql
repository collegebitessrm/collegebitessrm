-- trending_restaurants() (added in 20260916000000_trending_leaderboard.sql)
-- was never called by the app — the "Top restaurants" leaderboard was
-- removed from the UI before shipping. Dropping it now that it's
-- confirmed unused, rather than leaving dead surface area in the schema.

drop function if exists public.trending_restaurants(int, int);

import "server-only";

import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type TrendingDish = {
  dishId: string;
  dishName: string;
  restaurantId: string;
  restaurantName: string;
  orderCount: number;
};

type TrendingDishRow = {
  dish_id: string;
  dish_name: string;
  restaurant_id: string;
  restaurant_name: string;
  order_count: number;
};

function getStatelessSupabase() {
  const adminClient = createAdminClient();
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Cached fetch of trending dishes across campus. Revalidated every 15 minutes to save CPU and DB resources.
 */
const getCachedTrendingDishesRaw = unstable_cache(
  async (daysBack: number, limit: number): Promise<TrendingDishRow[]> => {
    try {
      const supabase = getStatelessSupabase();
      const { data, error } = await supabase.rpc("trending_dishes", {
        days_back: daysBack,
        result_limit: limit,
      });

      if (error) {
        console.error("[trending_dishes] RPC error:", error.message);
        return [];
      }
      return (data ?? []) as TrendingDishRow[];
    } catch (err) {
      console.error("[trending_dishes] execution error:", err);
      return [];
    }
  },
  ["cb_trending_dishes_raw"],
  { revalidate: 900, tags: ["trending-dishes"] },
);

/** Top ordered dishes campus-wide over the last 7 days, ranked first in Home's "Campus favourites" row. */
export async function getTrendingDishes(limit = 5): Promise<TrendingDish[]> {
  const rows = await getCachedTrendingDishesRaw(7, Math.max(limit, 20));
  return rows.slice(0, limit).map((d) => ({
    dishId: d.dish_id,
    dishName: d.dish_name,
    restaurantId: d.restaurant_id,
    restaurantName: d.restaurant_name,
    // bigint in Postgres — coerce in case it ever arrives as a string.
    orderCount: Number(d.order_count),
  }));
}

/**
 * How many times each dish was ordered campus-wide over the last
 * `daysBack` days (dishId → count), for ordering the photos on Home's
 * restaurant cards. Cached for 15 minutes.
 *
 * Accepts either daysBack (number) or an array of dishIds (string[]).
 */
export async function getDishOrderCounts(
  daysBackOrDishIds?: number | string[],
): Promise<Record<string, number>> {
  const daysBack = typeof daysBackOrDishIds === "number" ? daysBackOrDishIds : 30;
  const filterIds = Array.isArray(daysBackOrDishIds) ? new Set(daysBackOrDishIds) : null;

  try {
    const data = await getCachedTrendingDishesRaw(daysBack, 500);
    const counts: Record<string, number> = {};
    for (const d of data) {
      if (!filterIds || filterIds.has(d.dish_id)) {
        counts[d.dish_id] = Number(d.order_count);
      }
    }
    return counts;
  } catch (err) {
    console.error("getDishOrderCounts error:", err);
    return {};
  }
}

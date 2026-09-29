import "server-only";

import type { CartLine } from "@/lib/cart/store";
import { createClient } from "@/lib/supabase/server";

// How far back to look for a repeated order. Bounded so a long-time
// student's full order history is never fetched just to find one repeat —
// recent orders are also what "your usual" should mean in practice.
const RECENT_ORDERS_WINDOW = 30;

export type UsualCart = {
  restaurantId: string;
  restaurantName: string;
  lines: CartLine[];
};

type OrderRow = {
  restaurant_id: string;
  created_at: string;
  order_items: { dish_id: string | null; quantity: number }[];
};

/**
 * The exact dish+quantity combination this student has repeated most often
 * (delivered orders only), for the Home screen's "Your usual" chip. Only
 * counts as a "usual" once it's actually repeated (>= 2 identical orders,
 * ties going to whichever repeated more recently) — a single past order
 * isn't a habit yet. Dish price/name/availability and the restaurant's
 * open status are re-read live, same as everywhere else a stored cart
 * meets current menu data.
 */
export async function getUsualCart(userId: string): Promise<UsualCart | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("restaurant_id, created_at, order_items(dish_id, quantity)")
    .eq("user_id", userId)
    .eq("status", "delivered")
    .order("created_at", { ascending: false })
    .limit(RECENT_ORDERS_WINDOW)
    .returns<OrderRow[]>();

  if (error) throw error;
  const orders = data ?? [];
  if (orders.length === 0) return null;

  type Group = { restaurantId: string; count: number; mostRecent: string; lines: { dishId: string; quantity: number }[] };
  const groups = new Map<string, Group>();

  for (const o of orders) {
    const items = o.order_items.filter(
      (i): i is { dish_id: string; quantity: number } => i.dish_id !== null,
    );
    if (items.length === 0) continue;

    const sorted = [...items].sort((a, b) => a.dish_id.localeCompare(b.dish_id));
    const signature = `${o.restaurant_id}::${sorted.map((i) => `${i.dish_id}:${i.quantity}`).join(",")}`;

    const existing = groups.get(signature);
    if (existing) {
      existing.count += 1;
      if (o.created_at > existing.mostRecent) existing.mostRecent = o.created_at;
    } else {
      groups.set(signature, {
        restaurantId: o.restaurant_id,
        count: 1,
        mostRecent: o.created_at,
        lines: sorted.map((i) => ({ dishId: i.dish_id, quantity: i.quantity })),
      });
    }
  }

  const best = [...groups.values()]
    .filter((g) => g.count >= 2)
    .sort((a, b) => b.count - a.count || (a.mostRecent < b.mostRecent ? 1 : -1))[0];
  if (!best) return null;

  const [{ data: restaurant }, { data: dishes }] = await Promise.all([
    supabase.from("restaurants").select("id, name, is_active").eq("id", best.restaurantId).maybeSingle(),
    supabase
      .from("dishes")
      .select("id, name, price, is_veg, is_available")
      .in(
        "id",
        best.lines.map((l) => l.dishId),
      ),
  ]);

  if (!restaurant || !restaurant.is_active) return null;

  const dishMap = new Map((dishes ?? []).map((d) => [d.id, d]));
  const lines: CartLine[] = best.lines.flatMap((l) => {
    const dish = dishMap.get(l.dishId);
    if (!dish || !dish.is_available) return [];
    return [
      {
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        isVeg: dish.is_veg,
        // Not clamped to MAX_QUANTITY here — refillCart() owns that, same
        // as every other cart-store write path.
        quantity: l.quantity,
      },
    ];
  });

  if (lines.length === 0) return null;

  return { restaurantId: restaurant.id, restaurantName: restaurant.name, lines };
}

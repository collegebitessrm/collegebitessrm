import "server-only";

import { cache } from "react";
import type { SearchableDish } from "@/lib/data/restaurants";
import { createClient } from "@/lib/supabase/server";

export type LikedDish = SearchableDish & { restaurantName: string };

type LikedRow = {
 dish_id: string;
 dishes: {
 id: string;
 name: string;
 price: number;
 is_veg: boolean;
 is_available: boolean;
 restaurant_id: string;
 restaurants: { name: string } | null;
 dish_categories: { name: string } | null;
 } | null;
};

/**
 * Every dish this student has hearted (public.favorite_dishes, own rows
 * only under RLS), newest first, with what the menu card, Profile's
 * "Liked dishes" row and the food-type matching need. Errors read as "no
 * hearts" so no page breaks over it. Cached per request.
 */
export const getLikedDishes = cache(async function getLikedDishes(userId: string): Promise<LikedDish[]> {
 const supabase = await createClient();
 const { data, error } = await supabase
 .from("favorite_dishes")
 .select(
 "dish_id, dishes(id, name, price, is_veg, is_available, restaurant_id, restaurants(name), dish_categories(name))",
 )
 .eq("user_id", userId)
 .order("created_at", { ascending: false })
 .returns<LikedRow[]>();
 if (error || !data) return [];
 return data.flatMap(({ dishes: d }) =>
 d
 ? [
 {
 id: d.id,
 name: d.name,
 price: Number(d.price),
 isVeg: d.is_veg,
 isAvailable: d.is_available,
 restaurantId: d.restaurant_id,
 category: d.dish_categories?.name ?? null,
 restaurantName: d.restaurants?.name ?? "",
 },
 ]
 : [],
 );
});

import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/ids";
import type { Dish, DishCategory, MenuSection, Restaurant } from "./types";

/** All restaurants for the student home screen — open ones first. */
export async function getRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, phone, description, cuisine_tags, is_active")
    .order("is_active", { ascending: false })
    .order("name");

  if (error) throw error;
  return data;
}

export type SearchableDish = {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  restaurantId: string;
  /** e.g. "Non-Veg Biryani" — searched too, so "veg biryani" finds the whole section. */
  category: string | null;
};

/**
 * Every dish on every menu, trimmed to what Home's search needs — ~100
 * rows, so the whole list ships with the page and filtering happens on the
 * client as the student types. Dishes are public-read.
 */
export async function getSearchableDishes(): Promise<SearchableDish[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, price, is_veg, is_available, restaurant_id, sort_order, dish_categories(name)")
    .order("sort_order")
    .returns<
      {
        id: string;
        name: string;
        price: number;
        is_veg: boolean;
        is_available: boolean;
        restaurant_id: string;
        dish_categories: { name: string } | null;
      }[]
    >();

  if (error) throw error;
  return data.map((d) => ({
    id: d.id,
    name: d.name,
    price: Number(d.price),
    isVeg: d.is_veg,
    isAvailable: d.is_available,
    restaurantId: d.restaurant_id,
    category: d.dish_categories?.name ?? null,
  }));
}

export type RestaurantMenuStats = { dishCount: number; minPrice: number };

/**
 * Per-restaurant count of available dishes and the cheapest one's price —
 * the "24 dishes · from ₹60" line on Home's restaurant cards. One small
 * query over dishes (public-read) rather than a column anywhere.
 */
export async function getRestaurantMenuStats(): Promise<Record<string, RestaurantMenuStats>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dishes")
    .select("restaurant_id, price")
    .eq("is_available", true);

  if (error) throw error;
  const stats: Record<string, RestaurantMenuStats> = {};
  for (const { restaurant_id, price } of data) {
    const s = (stats[restaurant_id] ??= { dishCount: 0, minPrice: Number(price) });
    s.dishCount += 1;
    s.minPrice = Math.min(s.minPrice, Number(price));
  }
  return stats;
}

/**
 * Number of currently-active restaurants — the "all 3" in the profile's
 * Campus Explorer badge. Deliberately excludes deactivated restaurants:
 * counting them would make the badge permanently unreachable for every
 * student the moment any one restaurant is ever retired, since
 * `place_order()` only allows ordering from `is_active` restaurants.
 */
export async function getRestaurantCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("restaurants")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) throw error;
  return count ?? 0;
}

export type ThursdaySpecial = { restaurantId: string; restaurantName: string; dishId: string; dishName: string };

/**
 * The first available Thursday-only dish (note contains "Thursday") at an
 * open restaurant — powers Home's Thursday nudge banner. Not a dedicated
 * flag on the dish; `note` is the only place "Thursday Only" is recorded,
 * so that's what this matches against.
 */
export async function getThursdaySpecial(): Promise<ThursdaySpecial | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, sort_order, restaurant_id, restaurants!inner(name, is_active)")
    .ilike("note", "%thursday%")
    .eq("is_available", true)
    .eq("restaurants.is_active", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle<{ id: string; name: string; restaurant_id: string; restaurants: { name: string } }>();

  if (error) throw error;
  if (!data) return null;
  return {
    restaurantId: data.restaurant_id,
    restaurantName: data.restaurants.name,
    dishId: data.id,
    dishName: data.name,
  };
}

/**
 * One restaurant plus its menu grouped into sections, or null if it
 * doesn't exist. Sold-out dishes are included (shown, not addable).
 */
// cache(): generateMetadata and the page both ask for the same menu.
export const getRestaurantMenu = cache(async function getRestaurantMenu(
  id: string,
): Promise<{ restaurant: Restaurant; sections: MenuSection[] } | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();

  const [restaurantResult, categoriesResult, dishesResult] = await Promise.all([
    supabase
      .from("restaurants")
      .select("id, name, phone, description, cuisine_tags, is_active")
      .eq("id", id)
      .maybeSingle<Restaurant>(),
    supabase
      .from("dish_categories")
      .select("id, restaurant_id, name, sort_order")
      .eq("restaurant_id", id)
      .order("sort_order")
      .order("name")
      .returns<DishCategory[]>(),
    supabase
      .from("dishes")
      .select("id, restaurant_id, category_id, name, price, is_veg, note, is_available, sort_order")
      .eq("restaurant_id", id)
      .order("sort_order")
      .order("name")
      .returns<Dish[]>(),
  ]);

  if (restaurantResult.error) throw restaurantResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (dishesResult.error) throw dishesResult.error;

  const restaurant = restaurantResult.data;
  if (!restaurant) return null;

  const categories = categoriesResult.data ?? [];
  const dishes = dishesResult.data ?? [];

  const sections: MenuSection[] = categories
    .map((category) => ({
      category,
      dishes: dishes.filter((d) => d.category_id === category.id),
    }))
    .filter((s) => s.dishes.length > 0);

  const uncategorized = dishes.filter(
    (d) => !d.category_id || !categories.some((c) => c.id === d.category_id),
  );
  if (uncategorized.length > 0) sections.push({ category: null, dishes: uncategorized });

  return { restaurant, sections };
});

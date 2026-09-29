import {
  Apple,
  Citrus,
  CookingPot,
  Flame,
  GlassWater,
  LayoutGrid,
  Soup,
  Sparkles,
  Utensils,
  UtensilsCrossed,
  Wheat,
  type LucideIcon,
} from "lucide-react";

// Keyword -> icon, checked in order (first match wins) against the
// lowercased cuisine tag / dish-category name. Covers every value in the
// seed data (supabase/migrations/20260915060000_seed_restaurants.sql and
// 20260915140000_seed_new_restaurants.sql) — anything unrecognised (a
// category added by hand later) falls back to a plain fork-and-knife
// rather than guessing.
const RULES: [string, LucideIcon][] = [
  ["sugarcane", GlassWater],
  ["biryani", CookingPot],
  ["curr", Soup],
  ["tandoori", Flame],
  ["starter", UtensilsCrossed],
  ["bread", Wheat],
  ["fried rice", CookingPot],
  ["noodle", Soup],
  ["manchurian", Flame],
  ["juice", Citrus],
  ["fruit", Apple],
  ["special", Sparkles],
];

/** Small icon for a cuisine tag or dish-category name, e.g. "Non-Veg Biryani". */
export function getCuisineIcon(label: string): LucideIcon {
  const lower = label.toLowerCase();
  return RULES.find(([keyword]) => lower.includes(keyword))?.[1] ?? Utensils;
}

/** The "All" menu-category filter chip isn't a real category — fixed icon. */
export const AllCategoriesIcon: LucideIcon = LayoutGrid;

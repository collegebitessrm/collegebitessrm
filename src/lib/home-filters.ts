// Home's dish filter (Swiggy / Zomato style): food-type tiles, quick chips
// and a filter sheet, all applied on the device over the dishes that
// already ship with Home (getSearchableDishes). Client-safe — no server
// imports. The state lives in the URL (?type=biryani&diet=veg…), written
// with window.history.replaceState, so a back-navigation from a dish
// restores it and nothing round-trips to the server.

import type { SearchableDish } from "@/lib/data/restaurants";
import type { Restaurant } from "@/lib/data/types";

// ---- Food types ("What's on your mind?") -----------------------------------

export type FoodType = {
  key: string;
  label: string;
  /** The tile's photo — a literal path; renaming it means updating it here. */
  photo: string;
  match: (name: string, category: string) => boolean;
};

const has = (text: string, word: RegExp) => word.test(text);

/*
 * Matched on the dish name and its section together, since sections are
 * uneven ("Paneer Items", "SP Specials", "Veg Rice (750ml)"). A dish can
 * sit in several types (Paneer Fried Rice is Fried rice and Paneer), the
 * way Swiggy's tiles work. Order here is tile order.
 */
export const FOOD_TYPES: FoodType[] = [
  { key: "biryani", label: "Biryani", photo: "/photos/dishes/chicken-dum-biryani.jpg", match: (n) => has(n, /biryani/) },
  {
    key: "fried-rice",
    label: "Fried rice",
    photo: "/photos/dishes/chicken-fried-rice.jpg",
    match: (n) => has(n, /\brice\b/) && !has(n, /biryani/),
  },
  { key: "noodles", label: "Noodles", photo: "/photos/dishes/chicken-noodles.jpg", match: (n) => has(n, /noodles/) },
  {
    key: "starters",
    label: "Starters",
    photo: "/photos/dishes/chicken-65.jpg",
    match: (n, c) =>
      !has(n, /biryani|\brice\b|noodles/) &&
      (has(c, /starter/) || has(n, /\b65\b|manchurian|chilli|majestic|lollipop|crispy|pepper|garlic|555/)),
  },
  { key: "chicken", label: "Chicken", photo: "/photos/dishes/chilli-chicken.jpg", match: (n) => has(n, /chicken/) },
  { key: "paneer", label: "Paneer", photo: "/photos/dishes/paneer-65.jpg", match: (n) => has(n, /paneer/) },
  { key: "egg", label: "Egg", photo: "/photos/dishes/egg-manchurian.jpg", match: (n) => has(n, /\begg\b/) },
  { key: "mushroom", label: "Mushroom", photo: "/photos/dishes/chilli-mushroom.jpg", match: (n) => has(n, /mushroom/) },
];

export function isFoodType(dish: SearchableDish, type: FoodType): boolean {
  return type.match(dish.name.toLowerCase(), (dish.category ?? "").toLowerCase());
}

// ---- State -------------------------------------------------------------------

export type Diet = "veg" | "nonveg";
export type PriceBand = "u150" | "u200" | "200-300" | "300+";
export type SortKey = "recommended" | "price-asc" | "price-desc" | "fastest";

export type HomeFilters = {
  type: string | null;
  diet: Diet | null;
  price: PriceBand | null;
  /** Only restaurants that deliver within FAST_MINUTES. */
  fast: boolean;
  /** Only dishes ordered at least POPULAR_MIN times in the last 30 days. */
  popular: boolean;
  sort: SortKey;
  /** Restaurant ids; empty = all. */
  restaurants: string[];
  /** Include sold-out dishes (shown greyed). */
  soldOut: boolean;
};

export const EMPTY_FILTERS: HomeFilters = {
  type: null,
  diet: null,
  price: null,
  fast: false,
  popular: false,
  sort: "recommended",
  restaurants: [],
  soldOut: false,
};

export const FAST_MINUTES = 40;
export const POPULAR_MIN = 3;

export const PRICE_BANDS: { key: PriceBand; label: string; test: (p: number) => boolean }[] = [
  { key: "u150", label: "Under ₹150", test: (p) => p < 150 },
  { key: "u200", label: "Under ₹200", test: (p) => p < 200 },
  { key: "200-300", label: "₹200 – ₹300", test: (p) => p >= 200 && p <= 300 },
  { key: "300+", label: "₹300 and up", test: (p) => p > 300 },
];

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "recommended", label: "Recommended" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "fastest", label: "Fastest delivery" },
];

const oneOf = <T extends string>(value: string | null, options: readonly T[]): T | null =>
  value !== null && (options as readonly string[]).includes(value) ? (value as T) : null;

/** Reads the filters from the URL; anything unknown is ignored. */
export function parseFilters(params: URLSearchParams): HomeFilters {
  return {
    type: oneOf(params.get("type"), FOOD_TYPES.map((t) => t.key)),
    diet: oneOf(params.get("diet"), ["veg", "nonveg"] as const),
    price: oneOf(params.get("price"), PRICE_BANDS.map((b) => b.key)),
    fast: params.get("fast") === "1",
    popular: params.get("popular") === "1",
    sort: oneOf(params.get("sort"), SORTS.map((s) => s.key)) ?? "recommended",
    restaurants: (params.get("from") ?? "").split(",").filter(Boolean),
    soldOut: params.get("soldout") === "1",
  };
}

/** The query string for these filters ("" when nothing is set). */
export function serializeFilters(f: HomeFilters): string {
  const p = new URLSearchParams();
  if (f.type) p.set("type", f.type);
  if (f.diet) p.set("diet", f.diet);
  if (f.price) p.set("price", f.price);
  if (f.fast) p.set("fast", "1");
  if (f.popular) p.set("popular", "1");
  if (f.sort !== "recommended") p.set("sort", f.sort);
  if (f.restaurants.length) p.set("from", f.restaurants.join(","));
  if (f.soldOut) p.set("soldout", "1");
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** How many filters are on — the "Filters (n)" badge. The food type has its own tiles. */
export function activeCount(f: HomeFilters): number {
  return (
    (f.diet ? 1 : 0) +
    (f.price ? 1 : 0) +
    (f.fast ? 1 : 0) +
    (f.popular ? 1 : 0) +
    (f.sort !== "recommended" ? 1 : 0) +
    (f.restaurants.length ? 1 : 0) +
    (f.soldOut ? 1 : 0)
  );
}

export function isFiltering(f: HomeFilters): boolean {
  return f.type !== null || activeCount(f) > 0;
}

// ---- Applying ----------------------------------------------------------------

export type FilterContext = {
  restaurants: Restaurant[];
  /** getDishOrderCounts(): dishId -> orders in the last 30 days. */
  orderCounts: Record<string, number>;
};

/**
 * Filters and sorts `dishes` (already narrowed by the search box, if any).
 * When just browsing, dishes from a restaurant that's switched off are
 * left out — they can't be ordered — and sold-out ones only come back with
 * `soldOut`. While searching, both stay in (sold-out ones greyed, at the
 * end), as search always did: you learn it's sold out instead of "no match".
 * "Recommended" keeps the search's own order while searching, otherwise
 * puts the most-ordered first; ties keep menu order.
 */
export function applyFilters(
  dishes: SearchableDish[],
  f: HomeFilters,
  ctx: FilterContext,
  searching = false,
): SearchableDish[] {
  const byId = new Map(ctx.restaurants.map((r) => [r.id, r]));
  const type = f.type ? FOOD_TYPES.find((t) => t.key === f.type) : undefined;
  const band = f.price ? PRICE_BANDS.find((b) => b.key === f.price) : undefined;
  const from = new Set(f.restaurants);
  const count = (id: string) => ctx.orderCounts[id] ?? 0;
  const minutes = (d: SearchableDish) => byId.get(d.restaurantId)?.delivery_minutes ?? 60;

  const out = dishes.filter((d) => {
    const r = byId.get(d.restaurantId);
    if (!r) return false;
    if (!searching && !r.is_active) return false;
    if (!d.isAvailable && !f.soldOut && !searching) return false;
    if (type && !isFoodType(d, type)) return false;
    if (f.diet === "veg" && !d.isVeg) return false;
    if (f.diet === "nonveg" && d.isVeg) return false;
    if (band && !band.test(d.price)) return false;
    if (f.fast && r.delivery_minutes > FAST_MINUTES) return false;
    if (f.popular && count(d.id) < POPULAR_MIN) return false;
    if (from.size && !from.has(d.restaurantId)) return false;
    return true;
  });

  // Array.prototype.sort is stable, so equal keys keep the incoming order.
  const available = (d: SearchableDish) => (d.isAvailable ? 0 : 1);
  switch (f.sort) {
    case "price-asc":
      return out.sort((a, b) => available(a) - available(b) || a.price - b.price);
    case "price-desc":
      return out.sort((a, b) => available(a) - available(b) || b.price - a.price);
    case "fastest":
      return out.sort((a, b) => available(a) - available(b) || minutes(a) - minutes(b) || count(b.id) - count(a.id));
    default:
      return searching
        ? out.sort((a, b) => available(a) - available(b))
        : out.sort((a, b) => available(a) - available(b) || count(b.id) - count(a.id));
  }
}

/** How many dishes have been ordered often enough to count as popular — hides the chip when there's nothing to show. */
export function popularCount(dishes: SearchableDish[], orderCounts: Record<string, number>): number {
  return dishes.filter((d) => (orderCounts[d.id] ?? 0) >= POPULAR_MIN).length;
}

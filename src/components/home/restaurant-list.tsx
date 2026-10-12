"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SearchX, X } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { getRestaurantCardSlides } from "@/lib/data/dish-photos";
import type { RestaurantMenuStats, SearchableDish } from "@/lib/data/restaurants";
import type { TrendingDish } from "@/lib/data/trending";
import type { Restaurant } from "@/lib/data/types";
import {
 applyFilters,
 EMPTY_FILTERS,
 FAST_MINUTES,
 FOOD_TYPES,
 isFiltering,
 isFoodType,
 parseFilters,
 popularCount,
 POPULAR_MIN,
 serializeFilters,
 type HomeFilters,
} from "@/lib/home-filters";
import { matchesAll, queryTokens, searchDishes } from "@/lib/search";
import { DishGrid } from "./dish-grid";
import { FilterBar } from "./filter-bar";
import { FilterSheet } from "./filter-sheet";
import { FoodTypeRail } from "./food-type-rail";
import { buildRail, PopularRail } from "./popular-rail";
import { PromoCard } from "./promo-card";
import { RestaurantCard } from "./restaurant-card";

/**
 * Everything on Home below the header: promo banner, search pill,
 * "What's on your mind?" food-type tiles, the sticky quick-filter chips
 * (+ the filter sheet), and then either
 * - browsing: the popular / favourites photo row and every restaurant, or
 * - searching or filtering: a live dish grid and the restaurants that
 * serve something in it.
 * Filters live in the URL (lib/home-filters.ts); the search text is local.
 */
export function RestaurantList({
 restaurants,
 orderingEnabled,
 closedChip,
 closedLine,
 menuStats,
 dishes,
 dishOrderCounts,
 trendingDishes,
 cravings = [],
}: {
 restaurants: Restaurant[];
 /** Every dish (getSearchableDishes) — searched and filtered on the client. */
 dishes: SearchableDish[];
 orderingEnabled: boolean;
 /** "Closed" — the card's status chip while ordering is shut. */
 closedChip: string;
 /** "Ordering is closed right now" — the card's footer line while ordering is shut. */
 closedLine: string;
 menuStats: Record<string, RestaurantMenuStats>;
 /** getDishOrderCounts() — card photo order, "Recommended" sort and the Popular chip. */
 dishOrderCounts: Record<string, number>;
 /** getTrendingDishes() — ranked first in the "Campus favourites" photo row. */
 trendingDishes: TrendingDish[];
 /** Food-type keys to lead "What's on your mind?": the taste profile's cravings, then
 * what the student's hearted dishes point to (cravingOrder()). */
 cravings?: string[];
}) {
 const [query, setQuery] = useState("");
 const [sheetOpen, setSheetOpen] = useState(false);
 const params = useSearchParams();
 const filters = useMemo(() => parseFilters(params), [params]);
 const filterKey = serializeFilters(filters);

 function setFilters(next: HomeFilters) {
 // Native history: Next syncs useSearchParams with it, and nothing goes
 // back to the server. Replace, so filter taps don't pile up in Back.
 window.history.replaceState(null, "", `${window.location.pathname}${serializeFilters(next)}`);
 }

 const q = query.trim();
 const searching = q.length > 0;
 const showResults = searching || isFiltering(filters);

 const restaurantNames = useMemo(
 () => Object.fromEntries(restaurants.map((r) => [r.id, r.name])),
 [restaurants],
 );
 const slidesByRestaurant = useMemo(
 () =>
 Object.fromEntries(
 restaurants.map((r) => [
 r.id,
 getRestaurantCardSlides(
 r.name,
 dishes.filter((d) => d.restaurantId === r.id),
 dishOrderCounts,
 ),
 ]),
 ),
 [restaurants, dishes, dishOrderCounts],
 );
 const rail = useMemo(() => buildRail(trendingDishes, dishes, restaurants), [trendingDishes, dishes, restaurants]);

 // Tiles only for food types there's something to order in right now.
 const foodTypes = useMemo(() => {
 const open = new Set(restaurants.filter((r) => r.is_active).map((r) => r.id));
 const orderable = FOOD_TYPES.filter((t) =>
 dishes.some((d) => d.isAvailable && open.has(d.restaurantId) && isFoodType(d, t)),
 );
 // What they said they crave first (in the order they picked), then what
 // their hearts point to, then the rest as before.
 const rank = (key: string) => (cravings.includes(key) ? cravings.indexOf(key) : cravings.length);
 return [...orderable].sort((a, b) => rank(a.key) - rank(b.key));
 }, [restaurants, dishes, cravings]);
 const showPopular = useMemo(() => popularCount(dishes, dishOrderCounts) >= POPULAR_MIN, [dishes, dishOrderCounts]);

 // Search first (every typed word must start a word in the dish, its
 // section or its restaurant), then the filters on top.
 const searched = useMemo(
 () => (searching ? searchDishes(dishes, restaurantNames, q) : dishes),
 [searching, dishes, restaurantNames, q],
 );
 const ctx = useMemo(() => ({ restaurants, orderCounts: dishOrderCounts }), [restaurants, dishOrderCounts]);
 const results = useMemo(
 () => (showResults ? applyFilters(searched, filters, ctx, searching) : []),
 [showResults, searched, filters, ctx, searching],
 );

 // Restaurants: all of them while browsing; otherwise the ones serving
 // something in the results, plus — while searching — any whose own name,
 // area or cuisines match and that pass the restaurant-level filters.
 const tokens = queryTokens(q);
 const serving = new Set(results.map((d) => d.restaurantId));
 const from = new Set(filters.restaurants);
 const visible = showResults
 ? restaurants.filter(
 (r) =>
 serving.has(r.id) ||
 (searching &&
 matchesAll([r.name, r.description ?? "", ...r.cuisine_tags].join(" "), tokens) &&
 (!filters.fast || r.delivery_minutes <= FAST_MINUTES) &&
 (from.size === 0 || from.has(r.id))),
 )
 : restaurants;

 // When the filters change while you're scrolled past the chips (they're
 // sticky), bring the top of the results up to meet them.
 const resultsTopRef = useRef<HTMLDivElement>(null);
 const lastKeyRef = useRef(filterKey);
 useEffect(() => {
 if (lastKeyRef.current === filterKey) return;
 lastKeyRef.current = filterKey;
 const el = resultsTopRef.current;
 if (!el || el.getBoundingClientRect().top >= 0) return;
 const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
 }, [filterKey]);

 const typeLabel = filters.type ? FOOD_TYPES.find((t) => t.key === filters.type)?.label : undefined;
 const clearAll = () => {
 setQuery("");
 setFilters(EMPTY_FILTERS);
 };

 return (
 <>
 {/* Promo banner — right after greeting, hidden while searching/filtering */}
 {!showResults && <PromoCard />}

 <label className="relative mt-6 block">
 <span className="sr-only">Search dishes and restaurants</span>
 <Search
 className="pointer-events-none absolute top-1/2 left-5 z-10 size-5 -translate-y-1/2 text-orange-500"
 aria-hidden="true"
 weight="bold"
 />
 <input
 type="search"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search biryani, noodles, restaurants…"
 className="h-14 w-full rounded-full border border-border bg-card pr-12 pl-13 text-base shadow-card backdrop-blur outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:shadow-lg focus-visible:shadow-primary/10 focus-visible:ring-2 focus-visible:ring-primary/30 [&::-webkit-search-cancel-button]:hidden"
 />
 {query && (
 <button
 type="button"
 onClick={() => setQuery("")}
 aria-label="Clear search"
 className="absolute top-1/2 right-3.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-foreground outline-none hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
 >
 <X className="size-4" />
 </button>
 )}
 </label>

 <FoodTypeRail types={foodTypes} selected={filters.type} onSelect={(type) => setFilters({ ...filters, type })} />

 <FilterBar
 filters={filters}
 onChange={setFilters}
 onOpenSheet={() => setSheetOpen(true)}
 showPopular={showPopular}
 />
 <FilterSheet
 open={sheetOpen}
 onOpenChange={setSheetOpen}
 filters={filters}
 onApply={setFilters}
 countFor={(f) => applyFilters(searched, f, ctx, searching).length}
 restaurants={restaurants}
 showPopular={showPopular}
 />
 {/* Where "scroll to results" lands: just under the sticky chips. */}
 <div ref={resultsTopRef} aria-hidden="true" className="scroll-mt-16" />

 {!showResults && <PopularRail rail={rail} />}

 {showResults && (
 <section aria-labelledby="dish-results" className="mt-4">
 <div className="flex items-end justify-between gap-3">
 <h2 id="dish-results" className="font-heading text-title font-bold">
 {typeLabel ?? (searching ? "Dishes" : "Dishes for you")}
 </h2>
 <p className="shrink-0 pb-0.5 text-sm text-muted-foreground tabular-nums" aria-live="polite">
 {results.length} {results.length === 1 ? "dish" : "dishes"}
 </p>
 </div>
 {isFiltering(filters) && (
 <button
 type="button"
 onClick={() => setFilters(EMPTY_FILTERS)}
 className="mt-1 rounded-full text-sm font-semibold text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 Clear filters
 </button>
 )}
 {results.length > 0 && (
 <DishGrid key={`${q}${filterKey}`} dishes={results} restaurants={restaurants} />
 )}
 </section>
 )}

 {visible.length > 0 && (
 <>
 <div id="restaurants" className="mt-9 flex items-end justify-between gap-3">
 <h2 className="font-heading text-title font-bold">
 {showResults ? "Restaurants" : "Restaurants near campus"}
 </h2>
 <span className="shrink-0 pb-0.5 text-sm text-muted-foreground tabular-nums">
 {showResults ? `${visible.length} of ${restaurants.length}` : `${restaurants.length} kitchens`}
 </span>
 </div>
 <ul className="mt-4 flex flex-col gap-5">
 {visible.map((r, i) => (
 <li
 key={r.id}
 className="animate-slide-up-in"
 style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}
 >
 <RestaurantCard
 restaurant={r}
 orderingEnabled={orderingEnabled}
 closedChip={closedChip}
 closedLine={closedLine}
 stats={menuStats[r.id]}
 slides={slidesByRestaurant[r.id] ?? []}
 slideDelay={i * 700}
 eager={i === 0 && !showResults}
 />
 </li>
 ))}
 </ul>
 </>
 )}

 {showResults && results.length === 0 && visible.length === 0 && (
 <EmptyState
 compact
 icon={SearchX}
 title={searching ? `No match for "${q}"` : "Nothing matches those filters"}
 action={
 <button
 type="button"
 onClick={clearAll}
 className=" flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 {searching ? "Clear search and filters" : "Clear filters"}
 </button>
 }
 >
 {searching ? "Try a dish like biryani, noodles or 65." : "Try fewer filters, or another food type."}
 </EmptyState>
 )}
 </>
 );
}
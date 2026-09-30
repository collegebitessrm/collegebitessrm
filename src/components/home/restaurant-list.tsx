"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, SearchX, X } from "@/components/icons";
import { BlurImage } from "@/components/blur-image";
import { EmptyState } from "@/components/empty-state";
import { VegMark } from "@/components/veg-mark";
import { getDishPhoto, getRestaurantCardSlides } from "@/lib/data/dish-photos";
import type { RestaurantMenuStats, SearchableDish } from "@/lib/data/restaurants";
import type { TrendingDish } from "@/lib/data/trending";
import type { Restaurant } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { matchesAll, queryTokens, searchDishes } from "@/lib/search";
import { cn } from "@/lib/utils";
import { buildRail, PopularRail } from "./popular-rail";
import { PromoCard } from "./promo-card";
import { RestaurantCard } from "./restaurant-card";

export function RestaurantList({
  restaurants,
  orderingEnabled,
  closedChip,
  closedLine,
  menuStats,
  dishes,
  dishOrderCounts,
  trendingDishes,
}: {
  restaurants: Restaurant[];
  /** Every dish (getSearchableDishes) — searched on the client as the student types. */
  dishes: SearchableDish[];
  orderingEnabled: boolean;
  /** "Closed" — the card's status chip while ordering is shut. */
  closedChip: string;
  /** "Ordering is closed right now" — the card's footer line while ordering is shut. */
  closedLine: string;
  menuStats: Record<string, RestaurantMenuStats>;
  /** getDishOrderCounts() — the card photos lead with each restaurant's most-ordered dishes. */
  dishOrderCounts: Record<string, number>;
  /** getTrendingDishes() — the photo row's "Popular this week" when there's enough of it. */
  trendingDishes: TrendingDish[];
}) {
  const [query, setQuery] = useState("");

  const q = query.trim();
  const restaurantNames = useMemo(
    () => Object.fromEntries(restaurants.map((r) => [r.id, r.name])),
    [restaurants],
  );
  const slidesByRestaurant = useMemo(
    () =>
      Object.fromEntries(
        restaurants.map((r) => [r.id, getRestaurantCardSlides(
            r.name,
            dishes.filter((d) => d.restaurantId === r.id),
            dishOrderCounts,
          ),
        ]),
      ),
    [restaurants, dishes, dishOrderCounts],
  );
  const rail = useMemo(
    () => buildRail(trendingDishes, dishes, restaurants),
    [trendingDishes, dishes, restaurants],
  );
  // Dishes first — that's what people usually type ("dum biryani", "juice").
  const dishResults = useMemo(() => searchDishes(dishes, restaurantNames, q), [dishes, restaurantNames, q]);
  // Restaurants match on their own text (every word, any order) or because
  // they serve one of the matching dishes.
  const tokens = queryTokens(q);
  const servesMatch = new Set(dishResults.map((d) => d.restaurantId));
  const visible = q
    ? restaurants.filter(
        (r) =>
          servesMatch.has(r.id) ||
          matchesAll([r.name, r.description ?? "", ...r.cuisine_tags].join(" "), tokens),
      )
    : restaurants;

  return (
    <>
      <label className="relative mt-6 block">
        <span className="sr-only">Search dishes and restaurants</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-primary"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search biryani, noodles, restaurants…"
          className="h-14 w-full rounded-full border bg-card/90 pr-12 pl-13 text-base shadow-card backdrop-blur outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/80 [&::-webkit-search-cancel-button]:hidden"
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

      {!q && (
        <>
          <PromoCard />
          <PopularRail rail={rail} />
        </>
      )}

      {q && dishResults.length > 0 && (
        <section aria-labelledby="dish-results" className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 id="dish-results" className="font-heading text-title font-bold">
              Dishes
            </h2>
            <span className="text-muted-foreground tabular-nums">{dishResults.length}</span>
          </div>
          <ul className="mt-3 divide-y rounded-3xl border bg-card shadow-card">
            {dishResults.map((d) => (
              <DishResult key={d.id} dish={d} restaurantName={restaurantNames[d.restaurantId] ?? ""} />
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex items-end justify-between gap-3">
        <h2 className="font-heading text-title font-bold">{q ? "Restaurants" : "Restaurants near campus"}</h2>
        <span className="shrink-0 pb-0.5 text-sm text-muted-foreground tabular-nums">
          {q ? `${visible.length} of ${restaurants.length}` : `${restaurants.length} kitchens`}
        </span>
      </div>

      {visible.length > 0 || dishResults.length > 0 ? (
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
                eager={i === 0 && !q}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState compact icon={SearchX} title={`No match for “${q}”`}>
          Try a dish like biryani, noodles or juice.
        </EmptyState>
      )}
    </>
  );
}

/**
 * One dish search result. Links to the restaurant's menu with ?dish=, which
 * scrolls to that dish and briefly outlines it (MenuView focusDishId) — the
 * same deep link the Trending popup uses.
 */
function DishResult({ dish, restaurantName }: { dish: SearchableDish; restaurantName: string }) {
  const photo = getDishPhoto(restaurantName, dish.name);
  return (
    <li>
      <Link
        href={`/restaurants/${dish.restaurantId}?dish=${dish.id}`}
        transitionTypes={["nav-forward"]}
        className="flex items-center gap-3 rounded-3xl py-3 pr-3 pl-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:ring-inset"
      >
        <span
          className={cn(
            "relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-pink-soft font-heading text-xl font-bold text-pink-soft-foreground/60",
            !dish.isAvailable && "grayscale",
          )}
        >
          {photo ? (
            <BlurImage src={photo} alt="" sizes="56px" className="object-cover" />
          ) : (
            <span aria-hidden="true">{dish.name.trim().charAt(0)}</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">
            <VegMark isVeg={dish.isVeg} className="mr-1.5 inline-flex size-4 -translate-y-px align-middle" />
            {dish.name}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {restaurantName}
            {!dish.isAvailable && " · Sold out"}
          </span>
        </span>
        <span className="shrink-0 font-heading font-bold tabular-nums">{formatRupees(dish.price)}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  );
}

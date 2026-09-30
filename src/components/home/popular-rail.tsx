import Link from "next/link";
import { BlurImage } from "@/components/blur-image";
import { Flame, Sparkle } from "@/components/icons";
import { VegMark } from "@/components/veg-mark";
import { getDishPhoto, getSignatureDishes } from "@/lib/data/dish-photos";
import type { SearchableDish } from "@/lib/data/restaurants";
import type { TrendingDish } from "@/lib/data/trending";
import type { Restaurant } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";

/** Most cards in the row. */
const MAX = 8;
/** Fewer trending dishes (with photos) than this and the row shows favourites instead. */
const MIN_TRENDING = 3;

type RailDish = {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  restaurantId: string;
  restaurantName: string;
  photo: string;
  rank?: number;
};

export type Rail = { kind: "trending" | "favourites"; dishes: RailDish[] };

/**
 * What Home's photo row shows. Real trending dishes (campus-wide orders,
 * last 7 days) when there are enough of them with photos; otherwise — at
 * launch, or in a quiet week — each restaurant's signature dishes,
 * interleaved, under an honest "Campus favourites" title rather than
 * pretending they're trending. Sold-out dishes and dishes without a
 * photo are skipped.
 */
export function buildRail(
  trending: TrendingDish[],
  dishes: SearchableDish[],
  restaurants: Restaurant[],
): Rail {
  const byId = new Map(dishes.map((d) => [d.id, d]));
  const names = new Map(restaurants.map((r) => [r.id, r.name]));

  const hot: RailDish[] = [];
  for (const t of trending) {
    const d = byId.get(t.dishId);
    const photo = d && getDishPhoto(t.restaurantName, d.name);
    if (!d || !d.isAvailable || !photo) continue;
    hot.push({ ...pick(d, t.restaurantName, photo), rank: hot.length + 1 });
  }
  if (hot.length >= MIN_TRENDING) return { kind: "trending", dishes: hot.slice(0, MAX) };

  // Round-robin through the restaurants' signature dishes, so the row
  // mixes kitchens instead of showing one restaurant's three first.
  const perRestaurant = restaurants
    .filter((r) => r.is_active)
    .map((r) =>
      getSignatureDishes(r.name).flatMap((name) => {
        const d = dishes.find((x) => x.restaurantId === r.id && x.name === name && x.isAvailable);
        const photo = d && getDishPhoto(r.name, d.name);
        return d && photo ? [pick(d, names.get(d.restaurantId) ?? r.name, photo)] : [];
      }),
    );
  const favourites: RailDish[] = [];
  for (let i = 0; favourites.length < MAX && perRestaurant.some((list) => i < list.length); i++) {
    for (const list of perRestaurant) if (list[i] && favourites.length < MAX) favourites.push(list[i]);
  }
  return { kind: "favourites", dishes: favourites };
}

function pick(d: SearchableDish, restaurantName: string, photo: string): RailDish {
  return { id: d.id, name: d.name, price: d.price, isVeg: d.isVeg, restaurantId: d.restaurantId, restaurantName, photo };
}

/**
 * Home's horizontal photo row — "Popular this week" (with #1, #2… badges)
 * or "Campus favourites". Each card opens the menu at that dish (?dish=).
 * Bleeds to the screen edges and snaps card by card.
 */
export function PopularRail({ rail }: { rail: Rail }) {
  if (rail.dishes.length === 0) return null;
  const trending = rail.kind === "trending";
  const Icon = trending ? Flame : Sparkle;

  return (
    <section aria-labelledby="popular-heading" className="mt-9">
      <div className="flex items-end justify-between gap-3">
        <h2 id="popular-heading" className="flex items-center gap-2 font-heading text-title font-bold">
          <Icon className="icon-tint-gold size-5.5 text-primary" />
          {trending ? "Popular this week" : "Campus favourites"}
        </h2>
        <p className="shrink-0 pb-0.5 text-sm text-muted-foreground">
          {trending ? "Most ordered" : "Signature dishes"}
        </p>
      </div>
      <ul className="-mx-6 mt-3 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pt-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rail.dishes.map((d, i) => (
          <li
            key={d.id}
            className="animate-slide-up-in w-36 shrink-0 snap-start"
            style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}
          >
            <Link
              href={`/restaurants/${d.restaurantId}?dish=${d.id}`}
              transitionTypes={["nav-forward"]}
              className="pressable group block rounded-[1.25rem] outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
            >
              <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-secondary shadow-card">
                <BlurImage
                  src={d.photo}
                  alt=""
                  sizes="144px"
                  className="object-cover transition-transform duration-(--dur-slow) ease-out-expo group-hover:scale-105"
                />
                {d.rank && (
                  <span className="absolute top-2 left-2 rounded-full bg-primary surface-primary px-2 py-0.5 font-heading text-xs font-bold text-primary-foreground">
                    #{d.rank}
                  </span>
                )}
                <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm">
                  <VegMark isVeg={d.isVeg} className="size-3.5 [&>span]:size-1.5" />
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-snug font-semibold">{d.name}</p>
              <p className="truncate text-xs text-muted-foreground">{d.restaurantName}</p>
              <p className="mt-0.5 font-heading font-bold text-primary">{formatRupees(d.price)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

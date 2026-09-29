import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CardSlide } from "@/lib/data/dish-photos";
import type { RestaurantMenuStats } from "@/lib/data/restaurants";
import type { Restaurant } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RestaurantPhotoSlides } from "./restaurant-photo-slides";

/*
 * Photo card: the cover, then the restaurant's dishes sliding past on
 * their own (RestaurantPhotoSlides), inset inside the card rather than a
 * full-bleed banner with the name over a dark scrim. Name,
 * cuisines, description and a short "24 dishes · from ₹60" line sit
 * underneath on the card surface, with the amber arrow as the one action
 * cue. Free delivery is campus-wide, so it's said once in the
 * handover strip above the list, not on every card.
 */
export function RestaurantCard({
  restaurant,
  orderingEnabled,
  closedChip = "Paused",
  closedLine = "Ordering paused",
  stats,
  slides,
  slideDelay,
}: {
  restaurant: Restaurant;
  orderingEnabled: boolean;
  closedChip?: string;
  closedLine?: string;
  stats?: RestaurantMenuStats;
  /** getRestaurantCardSlides() — cover, then dish photos. */
  slides: CardSlide[];
  slideDelay?: number;
}) {
  const active = restaurant.is_active;
  // Fully orderable only when both this restaurant and the campus-wide
  // switch say yes. "paused" (active but the switch is off) gets its own
  // tag rather than being lumped in with "closed" — the restaurant itself
  // didn't do anything, campus ordering is just off right now.
  const open = active && orderingEnabled;
  const paused = active && !orderingEnabled;

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      transitionTypes={["nav-forward"]}
      className="pressable group block rounded-[1.75rem] border bg-card p-2 shadow-card outline-none transition-shadow hover:shadow-raised focus-visible:ring-3 focus-visible:ring-ring/80"
    >
      <div className={cn("h-44 overflow-hidden rounded-[1.25rem]", !active && "opacity-60 grayscale")}>
        <RestaurantPhotoSlides
          slides={slides}
          restaurantHref={`/restaurants/${restaurant.id}`}
          autoplay={active}
          startDelay={slideDelay}
        >
          <span
            className={cn(
              "pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
              open ? "text-success" : "text-muted-foreground",
            )}
          >
            <span
              className={cn("size-1.5 rounded-full", open ? "bg-success" : "bg-muted-foreground")}
              aria-hidden="true"
            />
            {!active ? "Closed" : paused ? closedChip : "Open"}
          </span>
        </RestaurantPhotoSlides>
      </div>

      <div className="px-3 pt-3.5 pb-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-title font-bold">{restaurant.name}</h2>
            {restaurant.cuisine_tags.length > 0 && (
              <p className="mt-0.5 text-sm font-medium text-rose">
                {restaurant.cuisine_tags.join(" · ")}
              </p>
            )}
          </div>
          <span
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5",
              open ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
            aria-hidden="true"
          >
            <ArrowRight className="size-4.5" />
          </span>
        </div>
        {restaurant.description && (
          <p className="mt-1 text-sm text-muted-foreground">{restaurant.description}</p>
        )}
        <p className="mt-2.5 text-sm font-semibold">
          {open
            ? stats && `${stats.dishCount} ${stats.dishCount === 1 ? "dish" : "dishes"} · from ${formatRupees(stats.minPrice)}`
            : !active
              ? "Closed right now · menu still browsable"
              : `${closedLine} · browse the menu`}
        </p>
      </div>
    </Link>
  );
}

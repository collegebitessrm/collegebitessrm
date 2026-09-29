"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MessageSquareText, Star, StarHalf } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { AdminRestaurant, AdminReview } from "@/lib/data/admin";
import { formatOrderTimestamp } from "@/lib/date";
import { formatOrderNumber } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

const ALL = "all";
type Filter = "all" | "attention" | "notes";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "attention", label: "Needs attention" },
  { value: "notes", label: "With notes" },
];

/** A review "needs attention" when any dish in it got 2 stars or fewer. */
const needsAttention = (r: AdminReview) => r.ratings.some((x) => x.rating <= 2);

/**
 * /admin/reviews: dish averages (lowest first, so problems surface) and the
 * review list, both narrowed by the same restaurant tabs and filter chips.
 * All client-side over the one fetched list.
 */
export function ReviewsView({ reviews, restaurants }: { reviews: AdminReview[]; restaurants: AdminRestaurant[] }) {
  const [restaurant, setRestaurant] = useState(ALL);
  const [filter, setFilter] = useState<Filter>("all");

  const inRestaurant = useMemo(
    () => (restaurant === ALL ? reviews : reviews.filter((r) => r.restaurantId === restaurant)),
    [reviews, restaurant],
  );
  const visible = inRestaurant.filter((r) =>
    filter === "attention" ? needsAttention(r) : filter === "notes" ? !!r.note : true,
  );

  // Per-dish averages over the selected restaurant's reviews (not the
  // attention/notes filter — averages should reflect every rating).
  const dishes = useMemo(() => {
    const map = new Map<string, { name: string; restaurant: string; sum: number; count: number }>();
    for (const r of inRestaurant) {
      for (const x of r.ratings) {
        const key = x.dishId ?? `${r.restaurantId}:${x.dishName}`;
        const d = map.get(key) ?? { name: x.dishName, restaurant: r.restaurantName, sum: 0, count: 0 };
        d.sum += x.rating;
        d.count += 1;
        map.set(key, d);
      }
    }
    return [...map.values()]
      .map((d) => ({ ...d, avg: d.sum / d.count }))
      .sort((a, b) => a.avg - b.avg || b.count - a.count);
  }, [inRestaurant]);

  const allRatings = inRestaurant.flatMap((r) => r.ratings.map((x) => x.rating));
  const overall = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <Tab active={restaurant === ALL} onClick={() => setRestaurant(ALL)}>
          All restaurants
        </Tab>
        {restaurants.map((r) => (
          <Tab key={r.id} active={restaurant === r.id} onClick={() => setRestaurant(r.id)}>
            {r.name}
          </Tab>
        ))}
      </div>

      {inRestaurant.length === 0 ? (
        <EmptyState compact icon={Star} title="No ratings yet">
          Students can rate an order for 7 days after it&apos;s delivered.
        </EmptyState>
      ) : (
        <>
          <section aria-labelledby="dish-averages">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="dish-averages" className="font-heading text-title font-bold">
                Dish averages
              </h2>
              {overall !== null && (
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Star className="size-4 fill-primary text-primary" aria-hidden="true" />
                  {overall.toFixed(1)} overall · {allRatings.length} ratings
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Lowest rated first.</p>
            <ul className="mt-3 divide-y rounded-3xl border bg-card shadow-card">
              {dishes.map((d) => (
                <li key={`${d.restaurant}:${d.name}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{d.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {restaurant === ALL && `${d.restaurant} · `}
                      {d.count} {d.count === 1 ? "rating" : "ratings"}
                    </p>
                  </div>
                  <Stars value={d.avg} />
                  <span
                    className={cn(
                      "w-9 text-right font-heading font-bold tabular-nums",
                      d.avg <= 2.5 && "text-destructive",
                    )}
                  >
                    {d.avg.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="review-list">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="review-list" className="font-heading text-title font-bold">
                Reviews
              </h2>
              <div className="flex gap-2" role="radiogroup" aria-label="Filter reviews">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    role="radio"
                    aria-checked={filter === f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      "h-9 rounded-full px-3.5 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                      filter === f.value ? "bg-ink text-ink-foreground" : "bg-secondary text-secondary-foreground hover:bg-border",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <EmptyState compact icon={MessageSquareText} title="Nothing here">
                No reviews match this filter.
              </EmptyState>
            ) : (
              <ul className="mt-3 grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((r) => (
                  <ReviewCard key={r.orderId} review={r} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: AdminReview }) {
  const attention = needsAttention(review);
  return (
    <li className={cn("rounded-3xl border bg-card p-4 shadow-card", attention && "border-destructive/40")}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-2xl leading-none font-bold tabular-nums">
          {formatOrderNumber(review.dailyNumber)}
        </p>
        {attention && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
            Needs attention
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {review.restaurantName} · {review.studentName} · {formatOrderTimestamp(review.createdAt)}
      </p>
      <ul className="mt-3 flex flex-col gap-1.5">
        {review.ratings.map((x, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {x.quantity > 1 && <span className="font-semibold tabular-nums">{x.quantity}× </span>}
              {x.dishName}
            </span>
            <Stars value={x.rating} />
          </li>
        ))}
      </ul>
      {review.note && (
        <p className="mt-3 flex gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm">
          <MessageSquareText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>“{review.note}”</span>
        </p>
      )}
    </li>
  );
}

/** 5 stars with half-star rounding, e.g. 3.6 → ★★★½☆. */
function Stars({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="flex shrink-0 items-center" role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) =>
        n <= rounded ? (
          <Star key={n} className="size-4 fill-primary text-primary" aria-hidden="true" />
        ) : n - 0.5 === rounded ? (
          <span key={n} className="relative size-4" aria-hidden="true">
            <Star className="absolute inset-0 size-4 text-border" />
            <StarHalf className="absolute inset-0 size-4 fill-primary text-primary" />
          </span>
        ) : (
          <Star key={n} className="size-4 text-border" aria-hidden="true" />
        ),
      )}
    </span>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-10 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/80",
        active ? "bg-ink text-ink-foreground" : "bg-secondary text-secondary-foreground hover:bg-border",
      )}
    >
      {children}
    </button>
  );
}

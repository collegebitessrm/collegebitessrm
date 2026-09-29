"use client";

import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { TrendingDish } from "@/lib/data/trending";
import { cn } from "@/lib/utils";

const ordersLabel = (n: number) => `${n} ${n === 1 ? "order" : "orders"}`;
// ?dish= makes the menu open scrolled to (and briefly highlighting) this
// exact dish, so a tap here lands on the thing you tapped — not the top of
// a 40-dish menu.
const dishHref = (d: TrendingDish) => `/restaurants/${d.restaurantId}?dish=${d.dishId}`;

/**
 * Tapping the Home header's flame button pops up the top ordered dishes
 * this week — same pattern as AboutMuteBitesDialog on the logo. #1 gets a
 * full photo; the rest are thumbnail rows with their order counts.
 */
export function TrendingDialog({ dishes }: { dishes: TrendingDish[] }) {
  const [top, ...rest] = dishes;

  return (
    <Dialog>
      <DialogTrigger
        aria-label="Trending this week"
        className="pressable flex size-12 shrink-0 items-center justify-center rounded-2xl bg-card/80 shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
      >
        <Flame className="size-6 text-primary" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="flex items-center gap-2 font-heading text-title font-bold">
          <Flame className="size-5 text-primary" aria-hidden="true" />
          Trending this week
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {dishes.length === 0
            ? "No orders yet this week — be the first to start a trend."
            : "Most-ordered dishes on campus, last 7 days."}
        </DialogDescription>

        {top && (
          <Link
            href={dishHref(top)}
            transitionTypes={["nav-forward"]}
            className="pressable group mt-4 block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-brand-soft">
              <DishPhoto dish={top} sizes="(min-width: 384px) 336px, 85vw" className="text-5xl" />
              <span className="absolute top-2.5 left-2.5 rounded-full bg-primary px-2.5 py-0.5 font-heading text-sm font-bold text-primary-foreground">
                #1
              </span>
              <span className="absolute top-2.5 right-2.5 rounded-full bg-card/90 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                {ordersLabel(top.orderCount)}
              </span>
            </div>
            <p className="mt-2.5 font-heading text-lg leading-snug font-bold">{top.dishName}</p>
            <p className="text-sm text-muted-foreground">{top.restaurantName}</p>
          </Link>
        )}

        {rest.length > 0 && (
          <ol start={2} className="mt-3 divide-y border-t">
            {rest.map((d, i) => (
              <li key={d.dishId}>
                <Link
                  href={dishHref(d)}
                  transitionTypes={["nav-forward"]}
                  className="pressable flex items-center gap-3 rounded-xl py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
                >
                  <span className="w-5 shrink-0 text-center font-heading font-bold text-muted-foreground tabular-nums">
                    {i + 2}
                  </span>
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                    <DishPhoto dish={d} sizes="48px" className="text-lg" />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-semibold">{d.dishName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{d.restaurantName}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-heading font-bold tabular-nums">{d.orderCount}</span>
                    <span className="block text-xs text-muted-foreground">
                      {d.orderCount === 1 ? "order" : "orders"}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DishPhoto({ dish, sizes, className }: { dish: TrendingDish; sizes: string; className?: string }) {
  const photo = getDishPhoto(dish.restaurantName, dish.dishName);
  return photo ? (
    <BlurImage src={photo} alt="" sizes={sizes} className="object-cover" />
  ) : (
    <span
      className={cn(
        "flex size-full items-center justify-center font-heading font-bold text-brand-soft-foreground/60",
        className,
      )}
      aria-hidden="true"
    >
      {dish.dishName.trim().charAt(0)}
    </span>
  );
}

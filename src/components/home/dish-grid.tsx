"use client";

import { useState } from "react";
import Link from "next/link";
import { BlurImage } from "@/components/blur-image";
import { Timer } from "@/components/icons";
import { VegMark } from "@/components/veg-mark";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { SearchableDish } from "@/lib/data/restaurants";
import type { Restaurant } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Cards shown before "Show more" — each one is a photo download. */
const PAGE = 12;

/**
 * Home's filter / search results: a two-column grid of dish photo cards
 * (veg mark, name, restaurant and its delivery time, price in pink). A
 * card opens the menu at that dish (?dish=). Sold-out dishes (only there
 * when the sheet's "Show sold-out dishes" is on) are greyed. Shows PAGE
 * at a time.
 */
export function DishGrid({ dishes, restaurants }: { dishes: SearchableDish[]; restaurants: Restaurant[] }) {
  const [shown, setShown] = useState(PAGE);
  const byId = new Map(restaurants.map((r) => [r.id, r]));
  const rest = dishes.length - shown;

  return (
    <>
      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-5">
        {dishes.slice(0, shown).map((d, i) => {
          const r = byId.get(d.restaurantId);
          const photo = r ? getDishPhoto(r.name, d.name) : undefined;
          return (
            <li
              key={d.id}
              className="animate-slide-up-in"
              style={{ animationDelay: `${Math.min(i % PAGE, 7) * 45}ms` }}
            >
              <Link
                href={`/restaurants/${d.restaurantId}?dish=${d.id}`}
                transitionTypes={["nav-forward"]}
                className="pressable group block rounded-[1.25rem] outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
              >
                <div
                  className={cn(
                    "relative flex aspect-square items-center justify-center overflow-hidden rounded-[1.25rem] bg-pink-soft font-heading text-4xl font-bold text-pink-soft-foreground/60 shadow-card",
                    !d.isAvailable && "grayscale",
                  )}
                >
                  {photo ? (
                    <BlurImage
                      src={photo}
                      alt=""
                      sizes="(min-width: 448px) 190px, 45vw"
                      className="object-cover transition-transform duration-(--dur-slow) ease-out-expo group-hover:scale-105"
                    />
                  ) : (
                    <span aria-hidden="true">{d.name.trim().charAt(0)}</span>
                  )}
                  <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm">
                    <VegMark isVeg={d.isVeg} className="size-3.5 [&>span]:size-1.5" />
                  </span>
                  {!d.isAvailable && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                      Sold out
                    </span>
                  )}
                </div>
                <p className={cn("mt-2 line-clamp-2 leading-snug font-semibold", !d.isAvailable && "line-through opacity-70")}>
                  {d.name}
                </p>
                {r && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <span className="truncate">{r.name}</span>
                    <span aria-hidden="true">·</span>
                    <Timer className="size-3 shrink-0" />
                    <span className="shrink-0">{r.delivery_minutes} min</span>
                  </p>
                )}
                <p className="mt-1 font-heading font-bold text-primary">{formatRupees(d.price)}</p>
              </Link>
            </li>
          );
        })}
      </ul>
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE)}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-full border bg-card text-sm font-semibold shadow-card outline-none hover:shadow-raised focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          Show {Math.min(rest, PAGE)} more {rest === 1 ? "dish" : "dishes"}
        </button>
      )}
    </>
  );
}

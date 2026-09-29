"use client";

import { Minus, Plus, Repeat, Star } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { VegMark } from "@/components/veg-mark";
import { MAX_QUANTITY } from "@/lib/cart/store";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { Dish } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
 * One dish in the menu's two-column photo grid: a big square photo with
 * the add control floating in its corner (a round "+", which becomes a
 * "− n +" stepper once the dish is in the cart, while the photo picks up
 * an amber ring), and name + price on the page underneath — no bordered
 * row, no "ADD" button hanging off a thumbnail. Dishes without a photo get
 * a typographic tile (their initial in the display face) instead of a
 * mismatched image.
 */
export function DishCard({
  dish,
  restaurantName,
  quantity,
  orderable,
  pausedOnly = false,
  pausedLabel = "Paused",
  isFavorite = false,
  isHighlyReordered = false,
  highlighted = false,
  onAdd,
  onChangeQuantity,
}: {
  dish: Dish;
  restaurantName: string;
  quantity: number;
  /** false when the restaurant is closed, or campus-wide ordering is paused — dishes are browse-only. */
  orderable: boolean;
  /** True when `orderable` is false only because of the campus-wide pause, not this restaurant's own status. */
  pausedOnly?: boolean;
  /** Chip text when pausedOnly, e.g. "Opens 1:30 PM". */
  pausedLabel?: string;
  /** This student's most-ordered dish at this restaurant. */
  isFavorite?: boolean;
  /** Campus-wide: several students have each reordered this dish 3+ times. */
  isHighlyReordered?: boolean;
  /** Just arrived here from a deep link (Trending, Thursday banner) — flash a ring. */
  highlighted?: boolean;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}) {
  const soldOut = !dish.is_available;
  const photo = getDishPhoto(restaurantName, dish.name);
  const inCart = quantity > 0;

  const control = soldOut ? null : !orderable ? (
    <span className="rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
      {pausedOnly ? pausedLabel : "Closed"}
    </span>
  ) : !inCart ? (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Add ${dish.name}`}
      className="animate-pop-in flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-raised outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80"
    >
      <Plus className="size-5" strokeWidth={2.5} />
    </button>
  ) : (
    <div className="animate-pop-in flex h-11 items-center gap-1 rounded-full bg-primary p-1 text-primary-foreground shadow-raised">
      <button
        type="button"
        onClick={() => onChangeQuantity(quantity - 1)}
        aria-label={`Remove one ${dish.name}`}
        className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/15 outline-none hover:bg-primary-foreground/25 focus-visible:ring-2 focus-visible:ring-primary-foreground"
      >
        <Minus className="size-4" />
      </button>
      <span
        key={quantity}
        className="animate-bounce-count min-w-5 text-center text-base font-bold tabular-nums"
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChangeQuantity(quantity + 1)}
        disabled={quantity >= MAX_QUANTITY}
        aria-label={`Add one more ${dish.name}`}
        className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/15 outline-none hover:bg-primary-foreground/25 focus-visible:ring-2 focus-visible:ring-primary-foreground disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );

  return (
    <article id={`dish-${dish.id}`} className="min-w-0 scroll-mt-24">
      <div
        className={cn(
          "relative aspect-square rounded-3xl bg-secondary transition-shadow",
          inCart && "ring-3 ring-primary ring-offset-2 ring-offset-background",
          highlighted &&
            "animate-highlight motion-reduce:outline-3 motion-reduce:outline-offset-3 motion-reduce:outline-rose",
        )}
      >
        {photo ? (
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <BlurImage
              src={photo}
              alt=""
              sizes="(min-width: 448px) 200px, 45vw"
              className={cn("object-cover", soldOut && "opacity-60 grayscale")}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-3xl bg-brand-soft font-heading text-6xl font-bold text-brand-soft-foreground/60"
            aria-hidden="true"
          >
            {dish.name.trim().charAt(0)}
          </div>
        )}

        {(isFavorite || isHighlyReordered) && (
          <span className="absolute top-2 left-2 inline-flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
            {isFavorite ? (
              <>
                <Star className="size-3 shrink-0 fill-primary text-primary" aria-hidden="true" />
                <span className="truncate">Your favorite</span>
              </>
            ) : (
              <>
                <Repeat className="size-3 shrink-0 text-success" aria-hidden="true" />
                <span className="truncate">Highly re-ordered</span>
              </>
            )}
          </span>
        )}

        {soldOut && (
          <span className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
            Sold out
          </span>
        )}

        {control && <div className="absolute right-2 bottom-2">{control}</div>}
      </div>

      <div className={cn("px-1 pt-2.5", soldOut && "opacity-55")}>
        <h3
          className={cn(
            "line-clamp-2 leading-snug font-semibold",
            soldOut && "text-muted-foreground line-through",
          )}
        >
          <VegMark isVeg={dish.is_veg} className="mr-1.5 inline-flex size-4 -translate-y-px align-middle" />
          {dish.name}
        </h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="font-heading text-lg font-bold">{formatRupees(dish.price)}</span>
          {dish.note && <span className="text-xs font-semibold text-rose">{dish.note}</span>}
        </p>
      </div>
    </article>
  );
}

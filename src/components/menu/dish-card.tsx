"use client";

import { useEffect, useRef } from "react";
import { ChevronRight, Minus, Plus, Repeat, Star } from "@/components/icons";
import { BlurImage } from "@/components/blur-image";
import { VegMark } from "@/components/veg-mark";
import { MAX_QUANTITY } from "@/lib/cart/store";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { Dish } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { splitPortion } from "@/lib/menu/portions";
import { HeartButton } from "./heart-button";

/*
 * One dish in the menu's two-column photo grid: a big square photo with
 * the add control floating in its corner, and name + price (in pink) on
 * the page underneath — no bordered row, no "ADD" button hanging off a
 * thumbnail. The control is one lit pill that GROWS from a round "+" into
 * a "− n +" stepper when the dish goes in the cart (and shrinks back when
 * it leaves), while the photo picks up a ring; keyboard focus follows it
 * from "+" to the stepper's "+" and back. Dishes without a photo get a
 * typographic tile (their initial in the display face) instead of a
 * mismatched image. A heart in the top corner saves it to the student's
 * liked dishes (HeartButton).
 *
 * Portion mode (`portions`, e.g. a biryani's Single and Full): one card for
 * the dish — base name, every portion's price, the photo — whose "+" opens
 * the menu's portion picker instead of adding straight away; once any
 * portion is in the cart the control shows the total and reopens it.
 */
export function DishCard({
  dish,
  restaurantName,
  quantity,
  orderable,
  pausedOnly = false,
  pausedLabel = "Paused",
  isUsual = false,
  isHighlyReordered = false,
  liked = false,
  highlighted = false,
  portions,
  onChoosePortion,
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
  /** Chip text when pausedOnly, e.g. "Closed". */
  pausedLabel?: string;
  /** This student's most-ordered dish at this restaurant. */
  isUsual?: boolean;
  /** Campus-wide: several students have each reordered this dish 3+ times. */
  isHighlyReordered?: boolean;
  /** The student has hearted this dish (favorite_dishes). */
  liked?: boolean;
  /** Just arrived here from a deep link (Trending, Thursday banner) — flash a ring. */
  highlighted?: boolean;
  /** Portion mode: the dish's sizes (`dish` is the first) with what's in the cart of each. */
  portions?: { label: string; dish: Dish; quantity: number }[];
  /** Portion mode: open the portion picker for this dish. */
  onChoosePortion?: () => void;
  onAdd: () => void;
  onChangeQuantity: (quantity: number) => void;
}) {
  const portioned = (portions?.length ?? 0) > 1;
  const soldOut = portioned ? portions!.every((p) => !p.dish.is_available) : !dish.is_available;
  const photo = getDishPhoto(restaurantName, dish.name);
  const displayName = portioned ? splitPortion(dish.name).base : dish.name;
  const inCart = quantity > 0;

  // Keyboard focus follows the control as it grows and shrinks: "+" →
  // the stepper's "+", and the stepper's "−" (taking it to 0) → "+".
  const addRef = useRef<HTMLButtonElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (inCart ? moreRef : addRef).current?.focus();
  }, [inCart]);

  const control = soldOut ? null : !orderable ? (
    <span className="rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
      {pausedOnly ? pausedLabel : "Closed"}
    </span>
  ) : portioned ? (
    // Portion mode: "+" (or the count, once something's in) opens the picker.
    <button
      type="button"
      onClick={onChoosePortion}
      aria-haspopup="dialog"
      aria-label={inCart ? `Change ${displayName}, ${quantity} in cart` : `Choose ${displayName}: ${portions!.map((p) => p.label).join(" or ")}`}
      className={cn(
        "surface-primary flex h-11 items-center justify-center gap-1 rounded-full bg-primary font-bold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80",
        inCart ? "glow-neon min-w-11 pr-2.5 pl-3.5" : "w-11 shadow-raised",
      )}
    >
      {inCart ? (
        <>
          <span key={quantity} className="animate-bounce-count tabular-nums">{quantity}</span>
          <ChevronRight className="size-4" />
        </>
      ) : (
        <Plus className="size-5" />
      )}
    </button>
  ) : (
    <div
      className={cn(
        "surface-primary flex h-11 items-center overflow-hidden rounded-full bg-primary text-primary-foreground transition-[width,box-shadow] duration-(--dur-base) ease-spring",
        // Lights up once the dish is in the cart; a plain lift before that,
        // so a 40-dish grid isn't 40 glows.
        inCart ? "glow-neon w-[7.25rem] p-1" : "w-11 shadow-raised",
      )}
    >
      {!inCart ? (
        <button
          ref={addRef}
          type="button"
          onClick={() => {
            moveFocus.current = addRef.current === document.activeElement;
            onAdd();
          }}
          aria-label={`Add ${dish.name}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full outline-none hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          <Plus className="size-5" />
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={(e) => {
              moveFocus.current = quantity === 1 && e.currentTarget === document.activeElement;
              onChangeQuantity(quantity - 1);
            }}
            aria-label={`Remove one ${dish.name}`}
            className="animate-pop-in flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 outline-none hover:bg-primary-foreground/25 focus-visible:ring-2 focus-visible:ring-primary-foreground"
          >
            <Minus className="size-4" />
          </button>
          <span
            key={quantity}
            className="animate-bounce-count min-w-5 flex-1 text-center text-base font-bold tabular-nums"
            aria-live="polite"
          >
            {quantity}
          </span>
          <button
            ref={moreRef}
            type="button"
            onClick={() => onChangeQuantity(quantity + 1)}
            disabled={quantity >= MAX_QUANTITY}
            aria-label={`Add one more ${dish.name}`}
            className="animate-pop-in flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 outline-none hover:bg-primary-foreground/25 focus-visible:ring-2 focus-visible:ring-primary-foreground disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <article id={`dish-${dish.id}`} className="min-w-0 scroll-mt-24">
      {/* Deep links (?dish=) to another portion land on this card too. */}
      {portioned &&
        portions!.slice(1).map((p) => <span key={p.dish.id} id={`dish-${p.dish.id}`} className="block scroll-mt-24" aria-hidden="true" />)}
      <div
        className={cn(
          "group/photo relative aspect-square rounded-3xl bg-secondary shadow-card transition-shadow",
          inCart && "ring-3 ring-primary ring-offset-2 ring-offset-background",
          highlighted &&
            "animate-highlight motion-reduce:outline-3 motion-reduce:outline-offset-3 motion-reduce:outline-aqua",
        )}
      >
        {photo ? (
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <BlurImage
              src={photo}
              alt=""
              sizes="(min-width: 448px) 200px, 45vw"
              className={cn(
                "object-cover transition-transform duration-(--dur-slow) ease-out-expo group-hover/photo:scale-105",
                soldOut && "opacity-60 grayscale",
              )}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-3xl bg-pink-soft font-heading text-6xl font-bold text-pink-soft-foreground/60"
            aria-hidden="true"
          >
            {dish.name.trim().charAt(0)}
          </div>
        )}

        {(isUsual || isHighlyReordered) && (
          <span className="absolute top-2 left-2 inline-flex max-w-[calc(100%-3.75rem)] items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
            {isUsual ? (
              <>
                <Star className="size-3 shrink-0 icon-solid text-gold-strong" aria-hidden="true" />
                <span className="truncate">Your usual</span>
              </>
            ) : (
              <>
                <Repeat className="size-3 shrink-0 text-success" aria-hidden="true" />
                <span className="truncate">Highly re-ordered</span>
              </>
            )}
          </span>
        )}

        <div className="absolute top-2 right-2">
          <HeartButton dishId={dish.id} dishName={displayName} initialLiked={liked} />
        </div>

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
          {displayName}
        </h3>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          {portioned ? (
            portions!.map((p) => (
              <span key={p.dish.id} className="text-sm whitespace-nowrap">
                <span className="text-muted-foreground">{p.label}</span>{" "}
                <span className="font-heading text-lg font-bold text-primary">{formatRupees(p.dish.price)}</span>
              </span>
            ))
          ) : (
            <span className="font-heading text-lg font-bold text-primary">{formatRupees(dish.price)}</span>
          )}
          {dish.note && <span className="text-xs font-semibold text-aqua">{dish.note}</span>}
        </p>
      </div>
    </article>
  );
}

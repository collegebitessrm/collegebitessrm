"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { MAX_QUANTITY } from "@/lib/cart/limits";
import { setQuantity, type CartLine } from "@/lib/cart/store";
import { getDishPhoto } from "@/lib/data/dish-photos";
import { formatRupees } from "@/lib/format";
import { BlurImage } from "@/components/blur-image";
import { VegMark } from "@/components/veg-mark";

const SWIPE_THRESHOLD = 88;
const MAX_DRAG = 132;
const REMOVE_DELAY = 180;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * One cart line, swipeable left to remove — an additional gesture layered
 * on top of the existing minus/plus buttons, not a replacement: the
 * buttons stay as the accessible way to remove an item for anyone who
 * can't (or doesn't know to) swipe.
 */
export function CartLineRow({ line, restaurantName }: { line: CartLine; restaurantName: string | null }) {
  const photo = restaurantName ? getDishPhoto(restaurantName, line.name) : undefined;
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const startX = useRef(0);
  const activePointerId = useRef<number | null>(null);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (removing) return;
    // A tap starting on the quantity buttons shouldn't start a drag — let
    // their own click behave exactly as before, uncaptured.
    if ((e.target as HTMLElement).closest("button")) return;
    activePointerId.current = e.pointerId;
    startX.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== e.pointerId) return;
    const next = Math.min(0, Math.max(-MAX_DRAG, e.clientX - startX.current));
    setDragX(next);
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>, commit: boolean) {
    if (activePointerId.current !== e.pointerId) return;
    activePointerId.current = null;
    setDragging(false);
    if (commit && dragX <= -SWIPE_THRESHOLD) {
      setRemoving(true);
      setDragX(-400);
      setTimeout(() => setQuantity(line.dishId, 0), prefersReducedMotion() ? 0 : REMOVE_DELAY);
    } else {
      setDragX(0);
    }
  }

  return (
    <li className="relative overflow-hidden border-b">
      <div
        className="absolute inset-y-0 right-0 flex w-24 items-center justify-center gap-1.5 bg-destructive text-sm font-semibold text-destructive-foreground"
        aria-hidden="true"
      >
        <Trash2 className="size-4" />
        Remove
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, true)}
        onPointerCancel={(e) => endDrag(e, false)}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging || prefersReducedMotion() ? "none" : "transform 200ms ease-out",
        }}
        className="relative flex touch-pan-y items-center gap-3 bg-background py-3.5"
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-brand-soft">
          {photo ? (
            <BlurImage src={photo} alt="" sizes="64px" className="object-cover" />
          ) : (
            <span
              className="flex size-full items-center justify-center font-heading text-2xl font-bold text-brand-soft-foreground/60"
              aria-hidden="true"
            >
              {line.name.trim().charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="leading-snug font-semibold">
            <VegMark isVeg={line.isVeg} className="mr-1.5 inline-flex size-4 -translate-y-px align-middle" />
            {line.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex h-9 items-center gap-1 rounded-full bg-secondary p-1">
              <button
                type="button"
                onClick={() => setQuantity(line.dishId, line.quantity - 1)}
                aria-label={`Remove one ${line.name}`}
                className="flex size-7 items-center justify-center rounded-full bg-card outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring/80"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="min-w-5 text-center text-sm font-bold tabular-nums">{line.quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(line.dishId, line.quantity + 1)}
                disabled={line.quantity >= MAX_QUANTITY}
                aria-label={`Add one more ${line.name}`}
                className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-40"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">{formatRupees(line.price)} each</span>
          </div>
        </div>
        <p className="self-start pt-0.5 text-right font-heading text-lg font-bold tabular-nums">
          {formatRupees(line.price * line.quantity)}
        </p>
      </div>
    </li>
  );
}

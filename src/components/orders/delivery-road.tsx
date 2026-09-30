"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Check, ChefHat, MapPin, Moped } from "@/components/icons";
import type { OrderStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/*
 * Where the scooter may be, per status, as [floor, ceiling] (0–1). Between
 * them it rides with the CLOCK — the share of the promised delivery time
 * (placed → placed + delivery_minutes) that has passed — so it creeps
 * forward minute by minute instead of jumping at the end. The ceilings
 * keep it honest: it never rides past "waiting for the restaurant" before
 * the order's confirmed, and never reaches the gate before it's delivered
 * (running late, it waits just short of Gate 3).
 */
const RANGE: Record<OrderStatus, [number, number]> = {
  pending: [0.06, 0.2],
  confirmed: [0.2, 0.94],
  preparing: [0.2, 0.94],
  out_for_delivery: [0.5, 0.94],
  delivered: [1, 1],
  cancelled: [0, 0],
};

/** How often the scooter moves on. */
const TICK_MS = 15_000;

function progressAt(status: OrderStatus, createdAt: string, minutes: number, now: number | null): number {
  const [floor, ceiling] = RANGE[status];
  // Before the first tick (and on the server) it sits at the floor, so the
  // server and browser render the same thing.
  if (now === null) return floor;
  const elapsed = (now - new Date(createdAt).getTime()) / (minutes * 60_000);
  return Math.min(ceiling, Math.max(floor, elapsed));
}

const MESSAGE: Record<OrderStatus, string> = {
  pending: "Waiting for the restaurant to confirm",
  confirmed: "Confirmed — it's being made",
  preparing: "Being made right now",
  out_for_delivery: "On its way to Gate 3",
  delivered: "At the gate — enjoy!",
  cancelled: "",
};

/**
 * The road from the kitchen to Gate 3, with the delivery scooter riding
 * along it with the clock (see RANGE) and the order's status (Realtime
 * moves it live on the tracking page): dashed lane markings, the stretch already covered lit
 * up, a chef's hat at the start and the Gate 3 pin at the end. The
 * scooter bobs while it's on the move and turns into a tick on arrival.
 *
 * Two tones: "hero" for the sunset pickup pass (dusk on sunset), "card"
 * for the Orders list's in-progress card (the pink action gradient).
 * Positions are a --p custom property (0–1), so moving it is just a CSS
 * transition on `left` / `width` (instant under reduced motion).
 */
export function DeliveryRoad({
  status,
  restaurantName,
  createdAt,
  deliveryMinutes,
  tone = "hero",
  showMessage = true,
}: {
  status: OrderStatus;
  restaurantName: string;
  /** When the order was placed — the start of the ride. */
  createdAt: string;
  /** The restaurant's promise — the ride's length. */
  deliveryMinutes: number;
  tone?: "hero" | "card";
  showMessage?: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  const riding = status !== "delivered" && status !== "cancelled";
  useEffect(() => {
    if (!riding) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, TICK_MS);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [riding]);
  const p = progressAt(status, createdAt, deliveryMinutes, now);
  const arrived = status === "delivered";
  const hero = tone === "hero";

  return (
    <div>
      {showMessage && (
        <p className="text-sm font-semibold" aria-live="polite">
          {MESSAGE[status]}
        </p>
      )}
      <div
        aria-hidden="true"
        className="relative mt-3 h-11"
        style={{ "--p": p } as CSSProperties}
      >
        {/* The road, with dashed lane markings. */}
        <span
          className={cn(
            "absolute inset-x-4 top-1/2 h-2 -translate-y-1/2 rounded-full",
            hero
              ? "bg-hero-foreground/15 bg-[repeating-linear-gradient(90deg,transparent_0_8px,color-mix(in_srgb,var(--hero-foreground)_22%,transparent)_8px_14px)]"
              : "bg-secondary bg-[repeating-linear-gradient(90deg,transparent_0_8px,color-mix(in_srgb,var(--muted-foreground)_20%,transparent)_8px_14px)]",
          )}
        />
        {/* The stretch already covered. */}
        <span
          className={cn(
            "absolute top-1/2 left-4 h-2 w-[calc((100%-2rem)*var(--p))] -translate-y-1/2 rounded-full transition-[width] duration-900 ease-out-expo",
            hero ? "bg-hero-foreground" : "surface-primary bg-primary",
          )}
        />
        <span
          className={cn(
            "absolute top-1/2 left-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-full",
            hero ? "bg-hero-foreground text-hero" : "bg-secondary text-muted-foreground",
          )}
        >
          <ChefHat className="size-4.5" />
        </span>
        {!arrived && (
          <span
            className={cn(
              "absolute top-1/2 right-0 flex size-8 -translate-y-1/2 items-center justify-center rounded-full",
              hero ? "bg-hero-foreground/15 text-hero-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            <MapPin className="size-4.5" />
          </span>
        )}
        {/* The scooter. */}
        <span
          className={cn(
            "absolute top-1/2 left-[calc(1rem+(100%-2rem)*var(--p))] flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-[left] duration-900 ease-out-expo",
            hero ? "bg-hero-foreground text-hero shadow-raised" : "surface-primary glow-neon bg-primary text-primary-foreground",
            arrived && "left-[calc(100%-1rem)]",
          )}
        >
          {arrived ? (
            <Check key="arrived" className="animate-pop-in size-5" />
          ) : (
            <Moped key="riding" className="animate-scooter size-6" weight="fill" />
          )}
        </span>
      </div>
      <p
        className={cn(
          "mt-1 flex justify-between gap-3 text-xs font-medium",
          hero ? "text-hero-foreground/85" : "text-muted-foreground",
        )}
      >
        <span className="truncate">{restaurantName}</span>
        <span className="shrink-0">Gate 3</span>
      </p>
    </div>
  );
}

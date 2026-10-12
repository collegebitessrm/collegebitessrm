"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Check, ChefHat, CookingPot, MapPin, Moped } from "@/components/icons";
import type { OrderStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/*
 * The same 75-minute timeline for every restaurant — animation only; the
 * ticket's "Delivery by" promise still uses the restaurant's
 * delivery_minutes. For the first COOK_MINUTES after placing, a cooking pot
 * sits at the kitchen end with a Gen Z kitchen line over it; then the
 * scooter takes over and rides with the clock, reaching just short of the
 * gate at RIDE_END_MINUTES, with on-the-way lines (RIDE_LINES). From
 * LATE_AFTER_MINUTES on it apologises instead (LATE_LINES).
 *
 * Status keeps it honest: a pending order (not confirmed yet) never leaves
 * the kitchen, "out for delivery" always shows the scooter, and nothing
 * reaches the gate until it's delivered.
 */
const COOK_MINUTES = 30;
export const RIDE_END_MINUTES = 75;
/** Not delivered this long after placing → the bubble says sorry. */
export const LATE_AFTER_MINUTES = 60;
/** The pot sits right on the kitchen (over the chef's hat). */
const KITCHEN_P = 0;
/** Where the scooter sets off, just past the kitchen. */
const RIDE_START_P = 0.1;
/** Where the scooter waits when it's running late. */
const GATE_WAIT_P = 0.94;

/** How often everything moves on. */
const TICK_MS = 15_000;
/** How often the bubble's line changes. */
const LINE_MS = 30_000;

const COOK_LINES = [
 "chef's locked in rn",
 "the wok is wokking",
 "letting it cook, literally",
 "spice level: immaculate",
 "it's giving fresh off the stove",
 "main character energy in the kitchen",
];

const RIDE_LINES = [
 "on the way, hold tight",
 "food's in the bag, we're moving",
 "zooming to Gate 3 rn",
 "hot food incoming, stay ready",
 "the scooty is scooting",
 "eta: soon. vibes: immaculate",
];

const LATE_LINES = [
 "sorry we're late, fr",
 "taking the scenic route, our bad",
 "almost there, no cap",
 "late but worth it, promise",
 "ok this one's on us, sorry",
 "traffic said no. we said yes",
];

const GATE_LINES = [
 "arrived at Gate 3",
 "at the gate, come collect",
 "we're here, Gate 3",
 "rider's waiting at Gate 3",
 "pull up to Gate 3, we got you",
 "Gate 3, come grab your food",
];

type Phase = {
 /** Position on the road, 0–1. */
 p: number;
 /** The pot instead of the scooter. */
 cooking: boolean;
 /** The speech bubble, if any. */
 line: string | null;
 late: boolean;
};

const pick = (lines: string[], ms: number) => lines[Math.floor(ms / LINE_MS) % lines.length];

function phaseAt(status: OrderStatus, createdAt: string, now: number | null): Phase {
 if (status === "delivered") return { p: 1, cooking: false, line: null, late: false };
 if (status === "cancelled") return { p: 0, cooking: false, line: null, late: false };
 // At the gate: scooter waits at GATE_WAIT_P with gate arrival lines
 if (status === "at_gate") {
 const gateLine = now === null ? null : pick(GATE_LINES, now - new Date(createdAt).getTime());
 return { p: GATE_WAIT_P, cooking: false, line: gateLine, late: false };
 }
 const onTheWay = status === "out_for_delivery";
 // Before the first tick (and on the server) it sits at the kitchen, so
 // the server and browser render the same thing.
 if (now === null) {
 return onTheWay
 ? { p: 0.5, cooking: false, line: null, late: false }
 : { p: KITCHEN_P, cooking: true, line: null, late: false };
 }
 const elapsed = now - new Date(createdAt).getTime();
 const late = elapsed >= LATE_AFTER_MINUTES * 60_000;
 const lateLine = late ? pick(LATE_LINES, elapsed - LATE_AFTER_MINUTES * 60_000) : null;

 const cooking = status === "pending" || (!onTheWay && elapsed < COOK_MINUTES * 60_000);
 if (cooking) {
 const kitchenLine = status === "pending" ? null : pick(COOK_LINES, elapsed);
 return { p: KITCHEN_P, cooking: true, line: lateLine ?? kitchenLine, late };
 }
 const ride = (elapsed - COOK_MINUTES * 60_000) / ((RIDE_END_MINUTES - COOK_MINUTES) * 60_000);
 const p = RIDE_START_P + Math.min(1, Math.max(0, ride)) * (GATE_WAIT_P - RIDE_START_P);
 return { p: onTheWay ? Math.max(0.5, p) : p, cooking: false, line: lateLine ?? pick(RIDE_LINES, elapsed), late };
}

const MESSAGE: Record<OrderStatus, string> = {
 pending: "Waiting for the restaurant to confirm",
 confirmed: "Confirmed, it's being made",
 preparing: "Being made right now",
 out_for_delivery: "On its way to Gate 3",
 at_gate: "Arrived at Gate 3. Come collect!",
 delivered: "At the gate. Enjoy!",
 cancelled: "",
};

/**
 * The road from the kitchen to Gate 3 (see phaseAt): first a cooking pot
 * jiggling at the kitchen, then the delivery scooter riding with the clock
 * and the order's status (Realtime moves it live on the tracking page),
 * with a speech bubble over it — kitchen lines while cooking, apologies
 * once it's late. Dashed lane markings, the stretch already covered lit
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
 tone = "hero",
 showMessage = true,
}: {
 status: OrderStatus;
 restaurantName: string;
 /** When the order was placed — the start of the timeline. */
 createdAt: string;
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
 const { p, cooking, line, late } = phaseAt(status, createdAt, now);
 const arrived = status === "delivered";
 const hero = tone === "hero";

 return (
 <div>
 {showMessage && (
 <p className="text-sm font-semibold" aria-live="polite">
 {MESSAGE[status]}
 {late && <span className="sr-only">. Running late, sorry.</span>}
 </p>
 )}
 <div
 aria-hidden="true"
 className={cn("relative h-11", line ? "mt-12" : "mt-3")}
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
 hero ? "bg-hero-foreground" : " bg-primary",
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
 hero ? "bg-hero-foreground/15 text-primary-foreground" : "bg-secondary text-muted-foreground",
 )}
 >
 <MapPin className="size-4.5" />
 </span>
 )}
 {/* The speech bubble (kitchen line or apology). It hangs from the
 pot / scooter's centre and slides left by --p of its own width, so
 it never leaves the road near either end; its tail follows. */}
 {line && (
 <span
 key={line}
 className={cn(
 "animate-pop-in absolute bottom-[calc(100%+0.25rem)] left-[calc(1rem+(100%-2rem)*var(--p))] origin-bottom translate-x-[calc(var(--p)*-100%)] rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap",
 hero
 ? "bg-hero-foreground text-hero shadow-raised"
 : "border bg-popover text-popover-foreground shadow-card",
 )}
 >
 {line}
 <span
 className={cn(
 "absolute top-full left-[clamp(0.9rem,calc(var(--p)*100%),calc(100%-0.9rem))] size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45",
 hero ? "bg-hero-foreground" : "border-r border-b bg-popover",
 )}
 />
 </span>
 )}
 {/* The scooter. */}
 <span
 className={cn(
 "absolute top-1/2 left-[calc(1rem+(100%-2rem)*var(--p))] flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition-[left] duration-900 ease-out-expo",
 hero ? "bg-hero-foreground text-hero shadow-raised" : " bg-primary text-primary-foreground",
 arrived && "left-[calc(100%-1rem)]",
 )}
 >
 {arrived ? (
 <Check key="arrived" className="animate-pop-in size-5" />
 ) : cooking ? (
 <span key="cooking" className="flex flex-col items-center">
 {/* Steam: three wisps rising off the pot and fading, a beat
 apart. The icon's own (still) steam is cropped off below. */}
 <svg
 viewBox="0 0 24 14"
 fill="none"
 stroke="currentColor"
 strokeWidth="2.25"
 strokeLinecap="round"
 className="h-3.5 w-5 overflow-visible"
 >
 <path className="cook-steam" d="M7 13c-2-3 2-5 0-8" />
 <path className="cook-steam" d="M12 12c-2-3 2-5 0-9" />
 <path className="cook-steam" d="M17 13c-2-3 2-5 0-8" />
 </svg>
 <span className="flex h-[18px] items-end overflow-hidden">
 <CookingPot className="animate-cook size-6 shrink-0" weight="fill" />
 </span>
 </span>
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

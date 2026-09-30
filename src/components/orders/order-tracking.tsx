"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewTransition } from "react";
import {
  ArrowLeft,
  Check,
  ChefHat,
  CookingPot,
  MapPin,
  Receipt,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { BrandLogo } from "@/components/brand-logo";
import { CelebrationOverlay } from "@/components/celebration-overlay";
import { NotifyMeCard } from "@/components/notifications/notify-me-card";
import { RateOrder } from "@/components/orders/rate-order";
import { SupportButtons } from "@/components/support-buttons";
import type { OrderDetail } from "@/lib/data/orders";
import type { OrderStatus } from "@/lib/data/types";
import { deliveryWindow, formatTime } from "@/lib/date";
import { getDishPhoto } from "@/lib/data/dish-photos";
import { formatRupees } from "@/lib/format";
import { NAV_TRANSITION } from "@/lib/nav-transition";
import { formatOrderNumber, orderTimeline, type TimelineStepState } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/** Native share sheet when available (mostly mobile); clipboard copy otherwise. */
async function shareOrderToken(token: string) {
  const text = `My College Bites order token: ${token}`;
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return;
    } catch {
      // Cancelled, or unsupported despite the feature check — fall through to copying.
    }
  }
  try {
    await navigator.clipboard.writeText(token);
    toast.success("Token copied!");
  } catch {
    toast.error("Couldn't copy — try selecting it manually.");
  }
}

// Confetti plays once ever, on whichever order happens to be the first
// this device sees placed — remembered locally, not tied to the account,
// so it survives across restaurants/orders but not across devices.
const CONFETTI_SHOWN_KEY = "collegebites.confetti-shown";

// One icon per row of orderTimeline() (order/status.ts), by position —
// "Order placed", "Pending confirmation" / "Restaurant confirmed", "Preparing & out for delivery".
const STEP_ICONS: LucideIcon[] = [Receipt, ChefHat, CookingPot];

/**
 * Renders the tracking page and keeps `status`/`updatedAt` live via
 * Supabase Realtime (subscribed to just this order's row — RLS still
 * governs whether this client is even allowed to receive it). Everything
 * else about the order (items, restaurant, total) never changes after
 * placement, so only these two fields need to be reactive.
 *
 * Falls back cleanly if Realtime never connects or the tab was in the
 * background: `initialOrder` came from the server component's own fetch,
 * so a plain page refresh always shows the true current status regardless
 * of whether the socket ever came up — the "Live" indicator is a bonus,
 * not something anything else here depends on.
 */
export function OrderTracking({
  initialOrder,
  justPlaced = false,
  openRating = false,
}: {
  initialOrder: OrderDetail;
  /** True once, right after this order was placed — shows a brief success moment. */
  justPlaced?: boolean;
  /** ?rate=1 — open the rating sheet on arrival (if the order is rateable). */
  openRating?: boolean;
}) {
  const router = useRouter();
  // Captured once, on mount — not the live `justPlaced` prop. The effect
  // below calls router.replace() to strip ?placed=1, which (this route
  // reads searchParams, so it's dynamically rendered) triggers a fresh
  // server render with justPlaced now false. If the effect depended on
  // the live prop instead, that re-render would unmount the success
  // overlay mid-moment.
  const [showSuccess] = useState(justPlaced);
  const [status, setStatus] = useState(initialOrder.status);
  const [updatedAt, setUpdatedAt] = useState(initialOrder.updatedAt);
  const [deliveredAt, setDeliveredAt] = useState(initialOrder.deliveredAt);
  const [live, setLive] = useState(false);

  useEffect(() => {
    // Strip ?placed=1 right away so a refresh doesn't replay the moment.
    if (showSuccess) router.replace(`/orders/${initialOrder.id}`);
  }, [initialOrder.id, showSuccess, router]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-${initialOrder.id}`)
      .on<{ status: OrderStatus; updated_at: string; delivered_at: string | null }>(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${initialOrder.id}` },
        (payload) => {
          setStatus(payload.new.status);
          setUpdatedAt(payload.new.updated_at);
          setDeliveredAt(payload.new.delivered_at);
        },
      )
      .subscribe((subscribeStatus) => setLive(subscribeStatus === "SUBSCRIBED"));

    return () => {
      setLive(false);
      supabase.removeChannel(channel);
    };
  }, [initialOrder.id]);

  const cancelled = status === "cancelled";
  const steps = cancelled ? [] : orderTimeline(status);
  const eta = deliveryWindow(initialOrder.createdAt, initialOrder.deliveryMinutes);
  // Up to three distinct photos of what was ordered, for the ticket's header.
  const photos = initialOrder.items
    .map((item) => ({ dishName: item.dishName, src: getDishPhoto(initialOrder.restaurantName, item.dishName) }))
    .filter((p): p is { dishName: string; src: string } => !!p.src)
    .filter((p, i, all) => all.findIndex((q) => q.src === p.src) === i)
    .slice(0, 3);

  return (
    <>
      {showSuccess && (
        <CelebrationOverlay confettiOnceKey={CONFETTI_SHOWN_KEY}>
          <BrandLogo className="animate-pop-in size-20 rounded-3xl" />
          <p className="animate-pop-in mt-5 font-heading text-2xl font-bold">Order placed!</p>
          <p className="mt-1 text-hero-foreground/85">Show this token at the gate</p>
          <p className="animate-pop-in mt-4 font-heading text-7xl font-bold tracking-tight text-hero-accent">
            {formatOrderNumber(initialOrder.dailyNumber)}
          </p>
        </CelebrationOverlay>
      )}
      <main className="mx-auto w-full max-w-md px-6 pb-12">
        <ViewTransition {...NAV_TRANSITION}>
          <div className="flex items-center gap-3 pt-4 pb-2">
            <Link
              href="/orders"
              aria-label="Back to your orders"
              transitionTypes={["nav-back"]}
              className="flex size-11 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/80"
            >
              <ArrowLeft className="size-5" />
            </Link>
          </div>

          <h1 className="sr-only">
            Order {formatOrderNumber(initialOrder.dailyNumber)} from {initialOrder.restaurantName}
          </h1>
          {/* The token as a ticket stub: what you ordered (photos) above
              the tear line, what you show at the gate below it. */}
          <div className="surface-hero glow-sun relative overflow-hidden rounded-3xl bg-hero text-hero-foreground">
            {photos.length > 0 && (
              <div
                className={cn("grid h-36 gap-1 p-2 pb-0", cancelled && "opacity-60 grayscale")}
                style={{ gridTemplateColumns: `repeat(${photos.length}, minmax(0, 1fr))` }}
              >
                {photos.map(({ dishName, src }, i) => (
                  <div
                    key={src}
                    className={cn(
                      "relative overflow-hidden bg-hero-foreground/10",
                      i === 0 && "rounded-tl-[1.25rem]",
                      i === photos.length - 1 && "rounded-tr-[1.25rem]",
                    )}
                  >
                    <BlurImage src={src} alt={dishName} sizes="(min-width: 448px) 400px, 90vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="px-6 pt-4 pb-5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-sm text-hero-foreground/85">
                  {initialOrder.restaurantName} · {formatTime(initialOrder.createdAt)}
                </p>
                {live && (
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-hero-success">
                    <span className="size-2.5 rounded-full bg-hero-success motion-safe:animate-pulse" aria-hidden="true" />
                    Live
                  </span>
                )}
              </div>
            </div>

            {/* Tear line: dashed rule with a notch cut out of each edge. */}
            <div className="relative h-0 border-t-2 border-dashed border-hero-foreground/20" aria-hidden="true">
              <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-background" />
              <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-background" />
            </div>

            <div className="px-6 pt-5 pb-6">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-label text-hero-accent">{cancelled ? "Order token" : "Show this token"}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className={cn("font-heading text-5xl leading-none font-bold", cancelled && "line-through opacity-60")}>
                      {formatOrderNumber(initialOrder.dailyNumber)}
                    </p>
                    <button
                      type="button"
                      onClick={() => shareOrderToken(formatOrderNumber(initialOrder.dailyNumber))}
                      aria-label="Share order token"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-hero-foreground/10 outline-none hover:bg-hero-foreground/20 focus-visible:ring-2 focus-visible:ring-hero-foreground"
                    >
                      <Share2 className="size-4" />
                    </button>
                  </div>
                </div>
                {!cancelled && (
                  <p className="shrink-0 text-right">
                    <span className="block text-sm text-hero-foreground/85">{eta.lead}</span>
                    <span className="block font-heading text-xl font-bold whitespace-nowrap">{eta.time}</span>
                  </p>
                )}
              </div>
              <p className="mt-5 flex items-center gap-2 rounded-xl bg-hero-foreground/10 px-4 py-2.5 text-sm">
                <MapPin className="size-4 shrink-0 text-hero-accent" aria-hidden="true" />
                Collect at Gate 3
              </p>
            </div>
          </div>

          {/* Still on its way: offer notifications instead of watching this page. */}
          {!cancelled && status !== "delivered" && <NotifyMeCard />}

          {cancelled ? (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-4">
              <p className="font-heading text-lg font-bold text-destructive">Order cancelled</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This order won&apos;t be delivered. If you were charged or have questions, call
                College Bites.
              </p>
            </div>
          ) : (
            <ol className="mt-6 flex flex-col">
              {steps.map((step, i) => (
                <li key={step.label} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <StepDot state={step.state} Icon={STEP_ICONS[i] ?? Check} />
                    {i < steps.length - 1 && (
                      <span
                        className={cn("w-0.5 flex-1", step.state === "done" ? "bg-success" : "bg-border")}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className={cn("pb-6", step.state === "upcoming" && "opacity-50")}>
                    <p className={cn("font-semibold", step.state === "current" && "text-primary")}>
                      {step.label}
                    </p>
                    {step.state === "current" && !step.label.startsWith("Preparing") && (
                      <p className="text-sm text-muted-foreground">Waiting for the restaurant to confirm…</p>
                    )}
                    {i === 0 && <p className="text-sm text-muted-foreground">{formatTime(initialOrder.createdAt)}</p>}
                    {step.state === "current" && step.label.startsWith("Preparing") && (
                      <p className="text-sm text-muted-foreground">We&apos;ll call you when we reach the gate.</p>
                    )}
                    {i === steps.length - 1 && step.state === "done" && (
                      <p className="text-sm text-muted-foreground">{formatTime(updatedAt)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}

          {/* Appears live the moment admin marks it delivered (status comes
              from the Realtime subscription above). */}
          {status === "delivered" && (
            <RateOrder
              orderId={initialOrder.id}
              restaurantName={initialOrder.restaurantName}
              items={initialOrder.items}
              deliveredAt={deliveredAt}
              initialReview={initialOrder.review}
              autoOpen={openRating}
            />
          )}

          <div className="mt-4 rounded-2xl border bg-card shadow-card p-5">
            <p className="text-label text-muted-foreground">Your order</p>
            <ul className="mt-2 divide-y">
              {initialOrder.items.map((item) => {
                const photo = getDishPhoto(initialOrder.restaurantName, item.dishName);
                return (
                  <li key={item.dishName} className="flex items-center gap-3 py-2.5">
                    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-pink-soft font-heading font-bold text-pink-soft-foreground/60">
                      {photo ? (
                        <BlurImage src={photo} alt="" sizes="44px" className="object-cover" />
                      ) : (
                        <span aria-hidden="true">{item.dishName.trim().charAt(0)}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="font-semibold tabular-nums">{item.quantity} ×</span> {item.dishName}
                    </span>
                    <span className="text-sm tabular-nums">{formatRupees(item.subtotal)}</span>
                  </li>
                );
              })}
            </ul>
            {initialOrder.notes && (
              <p className="mt-3 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
                “{initialOrder.notes}”
              </p>
            )}
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <p className="font-semibold">To pay at pickup</p>
              <p className="font-heading text-xl font-bold tabular-nums">{formatRupees(initialOrder.totalAmount)}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border bg-card shadow-card px-5 py-4">
            <div>
              <p className="text-sm text-muted-foreground">Something wrong?</p>
              <p className="font-semibold">Contact College Bites</p>
            </div>
            <SupportButtons
              whatsappMessage={`Hi College Bites, something's wrong with my order ${formatOrderNumber(initialOrder.dailyNumber)}.`}
            />
          </div>
        </ViewTransition>
      </main>
    </>
  );
}

function StepDot({ state, Icon }: { state: TimelineStepState; Icon: LucideIcon }) {
  if (state === "done") {
    return (
      <span className="animate-pop-in flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="size-4" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="relative flex size-9 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="animate-ping-slow absolute inset-0 rounded-full bg-primary/50" />
        <span className="relative flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Icon className="size-4" />
        </span>
      </span>
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-border text-muted-foreground">
      <Icon className="size-4" />
    </span>
  );
}

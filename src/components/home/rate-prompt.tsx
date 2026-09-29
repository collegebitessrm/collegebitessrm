"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { RatePromptOrder } from "@/lib/data/orders";
import { formatOrderNumber } from "@/lib/orders/status";

// Order ids this device has already been asked about — the pop-up shows
// once per order, ever, whether they rate or tap "Later". Per device, not
// per account, same as the confetti / milestone flags.
const PROMPTED_KEY = "mutebites.rate-prompted";

function readPrompted(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PROMPTED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Home's one-time "How was your A1 Dum Biryani?" pop-up for the student's
 * latest delivered-but-unrated order (still inside the 7-day window).
 * "Rate now" goes straight into the rating sheet via ?rate=1; the Orders
 * list's Rate pill stays as the reminder after this is dismissed.
 */
export function RatePrompt({ order }: { order: RatePromptOrder }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Deferred a tick: reading localStorage has to happen after hydration,
    // and a same-render setState in the effect body is what the lint rule
    // (and React) would rather avoid.
    const t = setTimeout(() => {
      if (readPrompted().includes(order.id)) return;
      setOpen(true);
      try {
        localStorage.setItem(PROMPTED_KEY, JSON.stringify([...readPrompted(), order.id].slice(-50)));
      } catch {
        // Storage unavailable (private mode) — it may ask again next visit; harmless.
      }
    }, 600);
    return () => clearTimeout(t);
  }, [order.id]);

  const photo = getDishPhoto(order.restaurantName, order.firstDish);
  const dishLabel =
    order.otherDishCount > 0 ? `${order.firstDish} + ${order.otherDishCount} more` : order.firstDish;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col items-center text-center">
        <span className="relative flex size-24 items-center justify-center overflow-hidden rounded-3xl bg-brand-soft font-heading text-4xl font-bold text-brand-soft-foreground/60 shadow-raised">
          {photo ? (
            <BlurImage src={photo} alt="" sizes="96px" className="object-cover" />
          ) : (
            <span aria-hidden="true">{order.firstDish.trim().charAt(0)}</span>
          )}
        </span>
        <DialogTitle className="mt-4 font-heading text-title font-bold">How was it?</DialogTitle>
        <DialogDescription className="mt-1 text-muted-foreground">
          Rate {dishLabel} from {order.restaurantName} — order {formatOrderNumber(order.dailyNumber)}.
          Only the MuteBites team sees it.
        </DialogDescription>
        <div className="mt-3 flex items-center gap-1 text-primary" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="size-6" />
          ))}
        </div>
        <div className="mt-5 flex w-full flex-col gap-2">
          <Link
            href={`/orders/${order.id}?rate=1`}
            transitionTypes={["nav-forward"]}
            onClick={() => setOpen(false)}
            className="pressable surface-primary flex h-12 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            Rate now
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-11 rounded-2xl font-semibold text-muted-foreground outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            Later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

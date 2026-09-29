"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cartTotals, useCart } from "@/lib/cart/store";
import { getDishPhoto } from "@/lib/data/dish-photos";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CartSheet } from "./cart-sheet";

/**
 * Floating "N items · ₹X · View cart" bar plus the cart sheet it opens.
 * Hidden while the cart is empty (the sheet stays open if you empty it).
 */
export function CartBar({
  profilePhone,
  currentRestaurantId,
  orderingEnabled,
  closedNote,
  hasTabBar = false,
}: {
  profilePhone: string;
  /** On a menu page: names the cart's restaurant when it's a different one. */
  currentRestaurantId?: string;
  /** Campus-wide kill switch — disables checkout in the cart sheet when off. */
  orderingEnabled: boolean;
  /** Why ordering is shut ("Ordering opens again at 1:30 PM"), shown in the cart sheet. */
  closedNote?: string;
  /** True on pages that also render <TabBar/> below — stacks the bar above it. */
  hasTabBar?: boolean;
}) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const totals = cartTotals(cart);
  const cartIsElsewhere = cart.restaurantId !== null && cart.restaurantId !== currentRestaurantId;

  return (
    <>
      {totals.items > 0 && (
        <>
          {/* Spacer so page content isn't hidden behind the bar. */}
          <div className="h-28" aria-hidden="true" />
          <div
            className={cn(
              "animate-slide-up-in fixed inset-x-0 z-20 mx-auto w-full max-w-md px-4",
              hasTabBar ? "bottom-20 pb-0" : "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom))]",
            )}
          >
            <div className="surface-ink shadow-elevated-glow flex items-center gap-3 rounded-3xl bg-ink p-3 pl-3.5 text-ink-foreground">
              {/* The actual food in the cart, not just a count: up to two
                  dish photos overlapping, falling back to the dish's initial.
                  Dropped below 360px so the total never gets squeezed. */}
              <div className="flex shrink-0 -space-x-3 max-[359px]:hidden" aria-hidden="true">
                {cart.lines.slice(0, 2).map((line) => {
                  const photo = cart.restaurantName ? getDishPhoto(cart.restaurantName, line.name) : undefined;
                  return (
                    <span
                      key={line.dishId}
                      className="animate-pop-in relative flex size-11 items-center justify-center overflow-hidden rounded-full bg-ink-foreground/15 font-heading text-lg font-bold ring-2 ring-ink"
                    >
                      {photo ? (
                        <Image src={photo} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        line.name.trim().charAt(0)
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm opacity-75">
                  <span key={totals.items} className="animate-bounce-count inline-block">
                    {totals.items}
                  </span>{" "}
                  {totals.items === 1 ? "item" : "items"}
                  {cartIsElsewhere && ` · ${cart.restaurantName}`}
                </p>
                <p className="font-heading text-2xl font-bold">{formatRupees(totals.amount)}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="surface-primary flex h-14 shrink-0 items-center gap-2 rounded-2xl bg-primary px-5 text-lg font-bold text-primary-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ink-foreground/80"
              >
                View cart <ArrowRight className="size-5" />
              </button>
            </div>
          </div>
        </>
      )}
      <CartSheet
        open={open}
        onOpenChange={setOpen}
        profilePhone={profilePhone}
        orderingEnabled={orderingEnabled}
        closedNote={closedNote}
      />
    </>
  );
}
